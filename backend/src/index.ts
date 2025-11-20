// Main Server File
import express from 'express';
import config from './config/env';

const app = express();

// Start the server
const server = app.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on port ${config.port}`);
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

