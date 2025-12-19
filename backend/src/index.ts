// Main Server File
import express from 'express';
import config, { HOST, FRONTEND_PORT } from './config/env';
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
// FRONTEND_PORT: frontend port (default: 5173)
// Allows requests from any host on this port (localhost, 192.168.x.x, tailscale IPs, etc.)
info(`CORS: Allowing requests from any host on port ${FRONTEND_PORT}`);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests without an origin (curl/postman)
        if (!origin) return callback(null, true as any);

        try {
            const url = new URL(origin);
            const port = url.port ? Number(url.port) : (url.protocol === 'https:' ? 443 : 80);

            // Allow if port matches frontend port (works for any hostname)
            if (port === FRONTEND_PORT) {
                return callback(null, true as any);
            }
        } catch { }

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

const server = app.listen(config.port, HOST, () => {
    info(`Server listening on 0.0.0.0:${config.port} — http://localhost:${config.port}/`);
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

