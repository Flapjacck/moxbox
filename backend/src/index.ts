// Main Server File
import express from 'express';
import config from './config/env';
import { initializeDatabase, closeDatabase } from './config/db';
import { initializeFilesModel } from './models/files';
import { initializeFoldersModel } from './models/folders';
import { initializeUsersModel } from './models/users';
import { initializeFirstUser } from './utils/initUser';
import routes from './routes';
import cors from 'cors';
import { NotFoundError } from './middleware/errors';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger, info } from './utils/logger';

// TODO: Add middleware for CORS, parsing, authentication and RBAC
// e.g., app.use(cors()), app.use(express.json()) and custom `authenticate` middleware

const app = express();
app.use(express.json()); // JSON body parsing middleware

// CORS Configuration
// ------------------
// FRONTEND_URLS: comma-separated list of allowed frontend origins (e.g.,
// "http://localhost:5173,http://10.10.4.208:5173,http://100.74.7.83:5173")
// ALLOW_ALL_ORIGINS: set to "true" to allow all origins (useful for development only)
const parseAllowedOrigins = (): string[] => {
    const envUrls = process.env.FRONTEND_URLS || process.env.FRONTEND_URL;

    if (!envUrls) {
        // Default to localhost:5173 if nothing is configured
        return ['http://localhost:5173'];
    }

    // Split by comma, trim, remove trailing slash, and dedupe
    const entries = envUrls
        .split(',')
        .map((u) => u.trim())
        .filter((u) => u.length > 0)
        .map((u) => u.replace(/\/+$/g, ''));
    return Array.from(new Set(entries));
};

const allowAllOrigins = (process.env.ALLOW_ALL_ORIGINS || '').toLowerCase() === 'true';
const allowedOrigins = parseAllowedOrigins();
info(`CORS allowed origins: ${allowedOrigins.join(', ')}`);

app.use(cors({
    origin: allowAllOrigins
        ? true // Reflect the request origin in the Access-Control-Allow-Origin header
        : (origin, callback) => {
            // Allow requests without an origin (curl/postman)
            if (!origin) return callback(null, true as any);
            const normalized = origin.replace(/\/+$/g, '');
            if (allowedOrigins.includes(normalized)) {
                return callback(null, true as any);
            }
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
initializeFoldersModel();
initializeUsersModel();
// Initialize first admin user if database is empty
initializeFirstUser().catch(err => {
    console.error('Failed to initialize first user:', err);
    process.exit(1);
});

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

