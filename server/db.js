const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

let sslConfig = false;

// Configure SSL if enabled
if (process.env.DB_SSL === 'true') {
    const caPath = process.env.DB_SSL_CA 
        ? path.resolve(__dirname, process.env.DB_SSL_CA)
        : path.join(__dirname, 'certs', 'isrgrootx1.pem');
    
    try {
        sslConfig = {
            ca: fs.readFileSync(caPath),
            rejectUnauthorized: false  // Set to true in production
        };
        console.log('✅ SSL certificate loaded successfully');
    } catch (err) {
        console.error('❌ Failed to load SSL certificate:', err.message);
        // Fallback: allow insecure connection (not recommended for production)
        sslConfig = {
            rejectUnauthorized: false
        };
    }
}

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 4000,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: sslConfig,
    // TiDB Cloud specific settings
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    connectTimeout: 30000, // 30 seconds
    // Timezone
    timezone: '+07:00'
});

const promisePool = pool.promise();

// Test connection on startup
async function testConnection() {
    try {
        const [rows] = await promisePool.query('SELECT 1 + 1 AS result');
        console.log('✅ TiDB Cloud connection successful');
        console.log(`📊 Connected to: ${process.env.DB_NAME}@${process.env.DB_HOST}`);
        return true;
    } catch (err) {
        console.error('❌ TiDB Cloud connection failed:', err.message);
        console.error('Connection details:', {
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            database: process.env.DB_NAME
        });
        return false;
    }
}

testConnection();

module.exports = promisePool;