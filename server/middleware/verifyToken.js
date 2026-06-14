const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const verifyToken = (req, res, next) => {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Access denied. No token provided.'
        });
    }
    
    try {
        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: 'Token has expired'
            });
        }
        return res.status(403).json({
            success: false,
            error: 'Invalid token'
        });
    }
};

// Role-based authorization middleware
const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Access denied. User not authenticated.'
            });
        }
        
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: `Access denied. ${req.user.role} role not authorized. Required roles: ${allowedRoles.join(', ')}`
            });
        }
        
        next();
    };
};

// Specific role check middleware
const isStudent = (req, res, next) => {
    if (req.user.role !== 'student') {
        return res.status(403).json({
            success: false,
            error: 'Access denied. Student role required.'
        });
    }
    next();
};

const isStaff = (req, res, next) => {
    if (req.user.role !== 'staff') {
        return res.status(403).json({
            success: false,
            error: 'Access denied. Staff role required.'
        });
    }
    next();
};

const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            error: 'Access denied. Admin role required.'
        });
    }
    next();
};

const isCVHT = (req, res, next) => {
    if (req.user.role !== 'cvht') {
        return res.status(403).json({
            success: false,
            error: 'Access denied. CVHT role required.'
        });
    }
    next();
};

module.exports = {
    verifyToken,
    authorizeRoles,
    isStudent,
    isStaff,
    isAdmin,
    isCVHT
};