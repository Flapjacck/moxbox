import express from 'express';
import userRoutes from './userRoutes';
import fileRoutes from './fileRoutes';
import accountRoutes from './accountRoutes';

const router = express.Router();

// Mount sub-route routers here
// TODO: Add authentication middleware where appropriate (e.g., `router.use(authenticate);`)
router.use('/users', userRoutes);
router.use('/files', fileRoutes);
router.use('/account', accountRoutes);

// API root — returns high-level info about the API
router.get('/', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Fileshare API',
        endpoints: {
            health: '/api/health',
            users: '/api/users',
            files: '/api/files',
            account: '/api/account',
        },
    });
});

// Health check — useful for readiness probes & monitoring
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: Date.now(),
    });
});

export default router;
