require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const { body } = require('express-validator');

// Import database connection
const connectDB = require('./database');

// Import our controllers
const userController = require('./userController');
const jobController = require('./jobController');
const authMiddleware = require('./authMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// ========== AUTH ROUTES ==========
// Signup route
app.post('/api/auth/signup', [
    body('firstName').trim().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
    body('lastName').trim().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['client', 'technician']).withMessage('Role must be client or technician')
], userController.signup);

// Login route
app.post('/api/auth/login', [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required')
], userController.login);

// Logout route
app.post('/api/auth/logout', authMiddleware.protect, userController.logout);

// Get user profile (protected route)
app.get('/api/auth/profile', authMiddleware.protect, userController.getProfile);

// Update user profile (protected route)
app.put('/api/auth/profile', authMiddleware.protect, userController.updateProfile);

// ========== JOB ROUTES ==========
// Get all jobs (for technicians to browse available jobs)
app.get('/api/jobs', authMiddleware.protect, jobController.getAllJobs);

// Get client's jobs
app.get('/api/jobs/my-requests', authMiddleware.protect, jobController.getClientJobs);

// Get technician's jobs
app.get('/api/jobs/my-jobs', authMiddleware.protect, jobController.getTechnicianJobs);

// Create a new job (clients only)
app.post('/api/jobs', authMiddleware.protect, [
    body('title').trim().isLength({ min: 5 }).withMessage('Title must be at least 5 characters'),
    body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
    body('category').isIn(['hvac', 'plumbing', 'electrical', 'appliance', 'other']).withMessage('Invalid category'),
    body('address').trim().isLength({ min: 5 }).withMessage('Address is required'),
    body('zipCode').trim().isLength({ min: 5 }).withMessage('Valid zip code is required')
], jobController.createJob);

// Accept a job (technicians only)
app.post('/api/jobs/:jobId/accept', authMiddleware.protect, jobController.acceptJob);

// Update job status
app.put('/api/jobs/:jobId/status', authMiddleware.protect, jobController.updateJobStatus);

// Get specific job details
app.get('/api/jobs/:jobId', authMiddleware.protect, jobController.getJobDetails);

// ========== API ROUTES ==========
// Health check
app.get('/api/health', (req, res) => {
    res.json({
        message: "🏠 HomeGuard Pro API is working!",
        status: "success",
        timestamp: new Date().toISOString(),
        features: {
            authentication: "✅ Active",
            userRegistration: "✅ Active",
            profileManagement: "✅ Active",
            jobManagement: "✅ Active",
            serviceRequests: "✅ Active"
        }
    });
});

// Get all users (for testing - remove in production)
app.get('/api/users', authMiddleware.protect, userController.getAllUsers);

// ========== WEBSITE ROUTES ==========
// Serve the main website
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('Error:', error);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!'
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`);
    console.log('🌐 Your website is now live!');
    console.log('🔐 Authentication system is ready!');
    console.log('🔧 Job management system is ready!');
    console.log('📝 Available API endpoints:');
    console.log('   POST /api/auth/signup - Create new account');
    console.log('   POST /api/auth/login - User login');
    console.log('   GET  /api/auth/profile - Get user profile');
    console.log('   GET  /api/jobs - Browse available jobs');
    console.log('   POST /api/jobs - Create service request');
    console.log('   POST /api/jobs/:id/accept - Accept a job');
    console.log('   GET  /api/health - System health check');
    console.log('Press Ctrl+C to stop the server');
});