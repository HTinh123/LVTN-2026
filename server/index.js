const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./route/auth.routes');
const adminRoutes = require('./route/admin.routes');
const staffRoutes = require('./route/staff.routes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/staff', staffRoutes);
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Server is working!',
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
});