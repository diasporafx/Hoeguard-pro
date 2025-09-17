const jwt = require('jsonwebtoken');
const User = require('./User'); // Import the User model

// Protect middleware - verifies JWT token
const protect = async (req, res, next) => {
    try {
        let token;

        // Get token from Authorization header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        // Get token from localStorage (for demo purposes)
        if (!token && req.headers['x-auth-token']) {
            token = req.headers['x-auth-token'];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Find user in database
            const user = await User.findById(decoded.userId);
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid token. User not found.'
                });
            }

            // Add user info to request
            req.userId = user._id;
            req.userName = user.name;
            req.userEmail = user.email;
            req.userRole = user.role;

            next();
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token.'
            });
        }

    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error in authentication'
        });
    }
};

// Role-based access control
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.userRole)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Role ${req.userRole} is not authorized.`
            });
        }
        next();
    };
};

module.exports = {
    protect,
    authorize
};