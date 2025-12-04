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

info(`CORS allowlist: ${allowedOrigins.join(', ')}`);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g., curl, CLI)
        if (!origin) return callback(null, true);

        info(`CORS incoming origin: ${origin}`);

        // Quick exact match check
        if (allowedOrigins.includes(origin)) {
            info(`CORS allow: exact match ${origin}`);
            return callback(null, true);
        }

        // If allowlist contains a permissive wildcard, allow any origin
        if (allowedOrigins.includes('*') || allowedOrigins.includes('ALL') || allowedOrigins.includes('all')) {
            info('CORS allow: wildcard present in allowlist');
            return callback(null, true);
        }

        try {
            const originUrl = new URL(origin);
            const originHost = originUrl.hostname;
            const originPort = originUrl.port || '';

            const permitted = allowedOrigins.some((a) => {
                // remove whitespace
                const entry = a.trim();
                if (!entry) return false;

                // If entry is a full URL e.g., http://1.2.3.4:5173
                if (entry.includes('://')) {
                    try {
                        const allowedUrl = new URL(entry);
                        const allowedHost = allowedUrl.hostname;
                        const allowedPort = allowedUrl.port || '';
                        if (allowedHost !== originHost) return false;
                        // If allowedPort is empty, allow any port
                        if (!allowedPort || allowedPort === originPort) return true;
                        return false;
                    } catch (e) {
                        // fall through to hostname-only handling
                    }
                }

                // If entry contains a colon (host:port) without scheme
                if (entry.includes(':')) {
                    const [h, p] = entry.split(':');
                    if (h === originHost && (p === originPort || p === '')) return true;
                    return false;
                }

                // hostname-only match
                if (entry === originHost) return true;
                return false;
            });

            if (permitted) {
                info(`CORS allow: matched host ${originHost}:${originPort}`);
                return callback(null, true);
            }
        } catch (err) {
            info(`CORS error parsing origin: ${String(err)}`);
        }

        info(`CORS block: ${origin} not in allowlist`);
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

// Debug endpoint to help verify CORS and headers remotely (e.g., mobile)
app.get('/api/_debug/cors', (req, res) => {
    res.json({
        allowedOrigins,
        originHeader: req.headers.origin || null,
        hostHeader: req.headers.host || null,
        referer: req.headers.referer || null
    });
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

