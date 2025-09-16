const express = require('express');
const router = express.Router();
const db = require('../database');
const authMiddleware = require('../middleware/auth');

// This middleware acts as a security guard for ALL routes defined in this file.
// A user MUST be logged in (i.e., provide a valid JWT) to access any of these endpoints.
router.use(authMiddleware);

// --- GET /api/pacts ---
// Fetches all pacts that the currently logged-in user is a part of.
router.get('/', (req, res) => {
    try {
        // req.user.id is attached by the authMiddleware
        const userPacts = db.getPactsForUser(req.user.id);
        res.json(userPacts);
    } catch (error) {
        console.error('Error fetching pacts:', error);
        res.status(500).json({ message: 'Server error while fetching pacts.' });
    }
});

// --- POST /api/pacts ---
// Creates a new pact. The logged-in user is automatically the host.
router.post('/', (req, res) => {
    try {
        const pactData = req.body;
        // Basic validation
        if (!pactData.title || !pactData.date || !pactData.guests || pactData.guests.length === 0) {
            return res.status(400).json({ message: 'Title, date, and at least one guest are required.' });
        }
        const newPact = db.createPact(req.user.id, pactData);
        // In a real-world application, this is where you would trigger sending invitation emails.
        res.status(201).json(newPact);
    } catch (error) {
        console.error('Error creating pact:', error);
        res.status(500).json({ message: 'Server error while creating the pact.' });
    }
});

// --- GET /api/pacts/:pactId ---
// Fetches the details for a single pact by its ID.
router.get('/:pactId', (req, res) => {
    try {
        const pact = db.pacts.find(p => p.id === req.params.pactId);
        
        // Security Check: Ensure the logged-in user is a participant of the pact they are trying to view.
        if (!pact || !pact.guests.find(g => g.userId === req.user.id)) {
            return res.status(404).json({ message: 'Pact not found or you do not have access.' });
        }
        res.json(pact);
    } catch (error) {
        console.error(`Error fetching pact ${req.params.pactId}:`, error);
        res.status(500).json({ message: 'Server error while fetching pact details.' });
    }
});

// --- POST /api/pacts/:pactId/rsvp ---
// Allows a user to RSVP to a pact they've been invited to.
router.post('/:pactId/rsvp', (req, res) => {
    try {
        const { status } = req.body; // Expected to be 'attending' or 'declined'
        if (!status || !['attending', 'declined'].includes(status)) {
            return res.status(400).json({ message: 'A valid status ("attending" or "declined") is required.' });
        }

        const updatedPact = db.rsvpToPact(req.user.id, req.params.pactId, status);
        
        if (!updatedPact) {
            return res.status(404).json({ message: 'Pact not found or you are not a guest on this pact.' });
        }
        res.json(updatedPact);
    } catch (error) {
        console.error(`Error RSVPing to pact ${req.params.pactId}:`, error);
        res.status(500).json({ message: 'Server error while updating your RSVP.' });
    }
});

module.exports = router;

