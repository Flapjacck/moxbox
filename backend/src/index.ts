// Main Server File
import express from 'express';
import config from './config/env';
import routes from './routes';

// TODO: Add middleware for CORS, parsing, authentication and RBAC
// e.g., app.use(cors()), app.use(express.json()) and custom `authenticate` middleware

const app = express();
app.use(express.json()); // JSON body parsing middleware

// Mount API routes 
app.use('/api', routes);

// Root route — in case someone visits the server base URL
app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'Fileshare backend is running', api: '/api/' });
});

// Start the server
const server = app.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on port ${config.port} — http://localhost:${config.port}/`);
});

// Graceful shutdown on signals
const graceful = () => {
    server.close(() => {
        // eslint-disable-next-line no-console
        console.log('Server closed');
        process.exit(0);
    });
};

process.on('SIGINT', graceful);
process.on('SIGTERM', graceful);

