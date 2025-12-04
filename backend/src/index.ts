// Main Server File
import express from 'express';
import config from './config/env';
import { initializeDatabase, closeDatabase } from './config/db';
import { initializeFilesModel } from './models/files';
import routes from './routes';
import cors from 'cors';
import { NotFoundError } from './middleware/errors';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger, info } from './utils/logger';

// =============================================================================
// CORS Configuration
// =============================================================================
// Parses FRONTEND_URLS env var (comma-separated) into an array of allowed origins.
// This allows requests from any IP address the server is accessible on.
// Example: "http://localhost:5173,http://10.10.4.208:5173,http://100.74.7.83:5173"
// =============================================================================
const parseAllowedOrigins = (): string[] => {
    const envUrls = process.env.FRONTEND_URLS || process.env.FRONTEND_URL;

    if (!envUrls) {
        // Fallback to localhost if no env var is set
        return ['http://localhost:5173'];
    }

    // Split by comma, trim whitespace, filter empty strings, strip trailing slash, and dedupe
    const entries = envUrls
        .split(',')
        .map((url) => url.trim())
        .filter((url) => url.length > 0)
        .map((url) => url.replace(/\/+$/, ''));

    // Unique list
    return Array.from(new Set(entries));
};

const allowedOrigins = parseAllowedOrigins();
info(`CORS allowed origins: ${allowedOrigins.join(', ')}`);

const app = express();
app.use(express.json()); // JSON body parsing middleware

// Dynamic CORS origin validation
// Checks if the request origin is in our allowed list, or allows requests
// with no origin (e.g., server-to-server, curl, Postman)
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (non-browser clients like curl, Postman)
        if (!origin) {
            return callback(null, true);
        }
        // Normalize origin by stripping trailing slash
        const normalized = origin.replace(/\/+$/, '');

        // Check if origin is in our allowed list
        if (allowedOrigins.includes(normalized)) {
            return callback(null, true);
        }

        // Origin not allowed - reject with error
        callback(new Error(`CORS: Origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
// Log incoming requests and their outcome
app.use(requestLogger);

// Mount API routes 
app.use('/api', routes);

// Handle Non existing API routes.
app.use('/api', (_req, _res, next) => next(new NotFoundError('API route not found')));

// Root route — in case someone visits the server base URL
app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'Fileshare backend is running', api: '/api/' });
});

// Handle Non existing routes.
app.use((_req, _res, next) => next(new NotFoundError('Route not found')));

// Initialize database and start the server
initializeDatabase();
// Initialize schema for models (tables, indexes, etc.)
initializeFilesModel();

const server = app.listen(config.port, config.host, () => {
    info(`Server listening on ${config.host}:${config.port} — http://${config.host}:${config.port}/`);
});

// Register the global error handler *after* all routes and middleware
app.use(errorHandler);

// Graceful shutdown on signals
const graceful = () => {
    server.close(() => {
        closeDatabase();
        info('Server closed');
        process.exit(0);
    });
};

process.on('SIGINT', graceful);
process.on('SIGTERM', graceful);

