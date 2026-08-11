process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION! Shutting down...');
    console.error(err.name, err.message);
    process.exit(1);
});

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const dns = require('node:dns');

// Fix for querySrv ECONNREFUSED by setting public DNS
dns.setServers(['8.8.8.8', '1.1.1.1']);
dotenv.config({ path: `${__dirname}/config.env` });

const app = require('./app');

mongoose
    .connect(process.env.DATABASE)
    .then(() => {
        console.log('✅ MongoDB connected successfully');
    })
    .catch((err) => {
        console.error('❌ MongoDB connection error:', err);
    });


const port = process.env.PORT || 8000;
const server = app.listen(port, () => {
    console.log('🚀 Server running on port ' + port);
});

process.on('unhandledRejection', (err) => {
    server.close(() => {
        process.exit(1);
    })
})