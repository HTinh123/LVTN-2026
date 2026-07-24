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

// CORS - Allow frontend URL
const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5173',
    'http://localhost:3000'
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = `CORS policy: ${origin} not allowed`;
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true
}));

app.use(express.json());

// Routes
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

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/dist')));
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
    });
}

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
});