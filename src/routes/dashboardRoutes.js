import express from 'express';
import { getAdminDashboard, getUserDashboard } from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Admin Dashboard
router.get('/admin', authenticate, getAdminDashboard);

// User Dashboard
router.get('/user', authenticate, getUserDashboard);

export default router;
