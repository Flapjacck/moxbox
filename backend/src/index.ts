// Main Server File
import express from 'express';
import config, { FRONTEND_ALLOWED_ORIGINS, FRONTEND_URL } from './config/env';
import { initializeDatabase, closeDatabase } from './config/db';
import { initializeFilesModel } from './models/files';
import routes from './routes';
import cors from 'cors';
import { NotFoundError } from './middleware/errors';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger, info } from './utils/logger';

// TODO: Add middleware for CORS, parsing, authentication and RBAC
// e.g., app.use(cors()), app.use(express.json()) and custom `authenticate` middleware

const app = express();
app.use(express.json()); // JSON body parsing middleware
// Build an allowlist using the CSV FRONTEND_ALLOWED_ORIGINS env var or single FRONTEND_URL
const allowedOriginsRaw = (FRONTEND_ALLOWED_ORIGINS && FRONTEND_ALLOWED_ORIGINS.length > 0)
    ? FRONTEND_ALLOWED_ORIGINS
    : (FRONTEND_URL || 'http://localhost:5173');
const allowedOrigins = allowedOriginsRaw
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // allow requests with no origin (curl, server-to-server)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        // allow by hostname:port matches if allowedOrigins contains host or host:port
        try {
            const originUrl = new URL(origin);
            const permitted = allowedOrigins.some((a) => {
                if (a === origin) return true;
                try {
                    const allowedUrl = new URL(a);
                    return allowedUrl.hostname === originUrl.hostname && (allowedUrl.port === originUrl.port || !allowedUrl.port);
                } catch (err) {
                    // Not a full URL; allow host-only matches like 'localhost' or 'mydomain'
                    return a === originUrl.hostname || a === `${originUrl.hostname}:${originUrl.port}`;
                }
            });
            if (permitted) return callback(null, true);
        } catch (_e) {
            // ignore parse errors; fall through to rejection
        }
        callback(new Error('Not allowed by CORS'));
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

