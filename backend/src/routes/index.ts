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

// TODO: Add health check and any other global routes

export default router;
