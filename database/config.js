const { Pool } = require('pg');
require('dotenv').config();

// Database configuration
const dbConfig = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'planpact',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // How long a client is allowed to remain idle
    connectionTimeoutMillis: 2000, // How long to wait for a connection
};

// Create connection pool
const pool = new Pool(dbConfig);

// Handle pool errors
pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

// Test database connection
async function testConnection() {
    try {
        const client = await pool.connect();
        console.log('✅ Database connected successfully');
        client.release();
        return true;
    } catch (err) {
        console.error('❌ Database connection failed:', err.message);
        return false;
    }
}

// Initialize database tables
async function initializeDatabase() {
    const fs = require('fs');
    const path = require('path');
    
    try {
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        await pool.query(schema);
        console.log('✅ Database schema initialized successfully');
        return true;
    } catch (err) {
        console.error('❌ Database initialization failed:', err.message);
        return false;
    }
}

// Database helper functions
const db = {
    // Execute a query
    async query(text, params) {
        const start = Date.now();
        try {
            const res = await pool.query(text, params);
            const duration = Date.now() - start;
            console.log('Executed query', { text, duration, rows: res.rowCount });
            return res;
        } catch (error) {
            console.error('Database query error:', error);
            throw error;
        }
    },

    // Get a client from the pool
    async getClient() {
        return await pool.connect();
    },

    // Begin a transaction
    async begin() {
        const client = await pool.connect();
        await client.query('BEGIN');
        return client;
    },

    // Commit a transaction
    async commit(client) {
        await client.query('COMMIT');
        client.release();
    },

    // Rollback a transaction
    async rollback(client) {
        await client.query('ROLLBACK');
        client.release();
    },

    // Close all connections
    async close() {
        await pool.end();
    },

    // Test connection
    testConnection,

    // Initialize database
    initializeDatabase
};

module.exports = db;
