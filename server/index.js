const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./route/auth.routes');
const adminRoutes = require('./route/admin.routes');
const staffRoutes = require('./route/staff.routes');
const advisorRoutes = require('./route/advisor.routes');
const studentRoutes = require('./route/student.routes');
const scoreRoutes = require('./route/score.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS - Allow Netlify frontend
const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:5173',
    'http://localhost:3000',
    'https://bright-biscochitos-c00950.netlify.app'
].filter(Boolean);

console.log('Allowed origins:', allowedOrigins);

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log('Blocked origin:', origin);
            callback(null, true); // Allow all for now, restrict later
        }
    },
    credentials: true
}));

app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/admin', adminRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/advisor', advisorRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/score', scoreRoutes);

// Health check
app.get('/api/health', async (req, res) => {
    try {
        const db = require('./db');
        await db.query('SELECT 1');
        res.json({ 
            status: 'OK',
            database: 'Connected',
            environment: process.env.NODE_ENV,
            frontend: process.env.FRONTEND_URL,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        res.status(500).json({ 
            status: 'Error',
            database: 'Disconnected',
            error: err.message 
        });
    }
});

// Root route - simple message
app.get('/', (req, res) => {
    res.json({ 
        message: 'DRL API Server',
        frontend: process.env.FRONTEND_URL,
        health: '/api/health'
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL}`);
});