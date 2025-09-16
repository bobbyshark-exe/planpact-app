#!/usr/bin/env node

/**
 * PlanPact Startup Script
 * This script helps you get PlanPact running quickly
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 PlanPact Startup Script');
console.log('========================\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
    console.log('📝 Creating .env file from template...');
    try {
        const envExample = fs.readFileSync(path.join(__dirname, 'env.example'), 'utf8');
        fs.writeFileSync(envPath, envExample);
        console.log('✅ .env file created! Please edit it with your settings.\n');
    } catch (error) {
        console.log('❌ Failed to create .env file:', error.message);
        process.exit(1);
    }
} else {
    console.log('✅ .env file already exists\n');
}

// Check if node_modules exists
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
    console.log('📦 Installing dependencies...');
    try {
        execSync('npm install', { stdio: 'inherit' });
        console.log('✅ Dependencies installed!\n');
    } catch (error) {
        console.log('❌ Failed to install dependencies:', error.message);
        process.exit(1);
    }
} else {
    console.log('✅ Dependencies already installed\n');
}

// Check database connection
console.log('🗄️  Checking database configuration...');
try {
    require('dotenv').config();
    const db = require('./database/config');
    
    if (process.env.DB_HOST && process.env.DB_NAME) {
        console.log('✅ Database configuration found');
        console.log(`   Host: ${process.env.DB_HOST}`);
        console.log(`   Database: ${process.env.DB_NAME}\n`);
    } else {
        console.log('⚠️  Database configuration not found in .env file');
        console.log('   Please configure your database settings\n');
    }
} catch (error) {
    console.log('⚠️  Database configuration check failed:', error.message);
    console.log('   Make sure PostgreSQL is installed and running\n');
}

// Check email configuration
console.log('📧 Checking email configuration...');
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    console.log('✅ Email configuration found');
    console.log(`   Email: ${process.env.EMAIL_USER}\n`);
} else {
    console.log('⚠️  Email configuration not found in .env file');
    console.log('   Please configure your email settings for notifications\n');
}

// Display startup instructions
console.log('🎉 Setup complete! Here\'s how to start PlanPact:\n');
console.log('1. Make sure PostgreSQL is running');
console.log('2. Create a database named "planpact" (or update .env)');
console.log('3. Run the database schema: psql planpact < database/schema.sql');
console.log('4. Start the server: npm start');
console.log('5. Open http://localhost:3000 in your browser\n');

console.log('📚 For more information, see README.md');
console.log('🚀 Happy planning with PlanPact!');

// Optionally start the server
if (process.argv.includes('--start')) {
    console.log('\n🚀 Starting PlanPact server...\n');
    require('./server.js');
}
