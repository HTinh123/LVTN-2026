// config.js
const config = {
    development: {
        BASE_URL: 'http://localhost:5000',
        API_URL: 'http://localhost:5000/api'
    },
    production: {
        BASE_URL: process.env.API_BASE_URL || 'https://your-production-url.com',
        API_URL: process.env.API_BASE_URL ? `${process.env.API_BASE_URL}/api` : 'https://your-production-url.com/api'
    }
};

const env = process.env.NODE_ENV || 'development';
module.exports = config[env];