const express = require('express');
const cors = require('cors');
const path = require('path');

// Load environment variables from a .env file
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---
app.use(cors());
app.use(express.json()); // To parse JSON bodies
app.use(express.static(path.join(__dirname, 'public'))); // Serve all static files from the 'public' folder

// --- API Routes ---
// Any request starting with /api/auth will be handled by auth.js
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Any request starting with /api/pacts will be handled by pacts.js
const pactRoutes = require('./routes/pacts');
app.use('/api/pacts', pactRoutes);


// --- Catch-all for Front-End Routing ---
// This sends any other request to your main index.html file.
// This is useful if you ever convert your front-end to a Single Page App (SPA).
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// --- Start the Server ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

