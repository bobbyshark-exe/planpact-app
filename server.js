const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files

// In-memory storage (replace with database in production)
let users = [];
let pacts = [];
let rsvps = [];

// Email configuration (using Gmail as example)
const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
    }
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'PlanPact API is running' });
});

// Authentication routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user already exists
        if (users.find(user => user.email === email)) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = {
            id: uuidv4(),
            name,
            email,
            password: hashedPassword,
            createdAt: new Date().toISOString()
        };

        users.push(user);

        // Generate JWT
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'User created successfully',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = users.find(u => u.email === email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// User routes
app.get('/api/user/profile', authenticateToken, (req, res) => {
    const user = users.find(u => u.id === req.user.userId);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
    });
});

// Pact routes
app.post('/api/pacts', authenticateToken, async (req, res) => {
    try {
        const {
            title,
            description,
            date,
            time,
            location,
            address,
            rsvpDeadline,
            sendReminders,
            allowPlusOnes,
            guests
        } = req.body;

        const pact = {
            id: uuidv4(),
            hostId: req.user.userId,
            title,
            description,
            date,
            time,
            location,
            address,
            rsvpDeadline,
            sendReminders,
            allowPlusOnes,
            guests: guests || [],
            createdAt: new Date().toISOString(),
            status: 'active'
        };

        pacts.push(pact);

        // Send invitations to guests
        if (guests && guests.length > 0) {
            await sendInvitations(pact);
        }

        res.status(201).json({
            message: 'Pact created successfully',
            pact
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/pacts', authenticateToken, (req, res) => {
    const userPacts = pacts.filter(pact => 
        pact.hostId === req.user.userId || 
        pact.guests.some(guest => guest.email === req.user.email)
    );

    res.json(userPacts);
});

app.get('/api/pacts/:id', authenticateToken, (req, res) => {
    const pact = pacts.find(p => p.id === req.params.id);
    
    if (!pact) {
        return res.status(404).json({ error: 'Pact not found' });
    }

    // Check if user has access to this pact
    const hasAccess = pact.hostId === req.user.userId || 
                     pact.guests.some(guest => guest.email === req.user.email);

    if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied' });
    }

    // Get RSVPs for this pact
    const pactRsvps = rsvps.filter(rsvp => rsvp.pactId === pact.id);

    res.json({
        ...pact,
        rsvps: pactRsvps
    });
});

app.put('/api/pacts/:id', authenticateToken, (req, res) => {
    const pactIndex = pacts.findIndex(p => p.id === req.params.id);
    
    if (pactIndex === -1) {
        return res.status(404).json({ error: 'Pact not found' });
    }

    if (pacts[pactIndex].hostId !== req.user.userId) {
        return res.status(403).json({ error: 'Only the host can edit this pact' });
    }

    pacts[pactIndex] = {
        ...pacts[pactIndex],
        ...req.body,
        updatedAt: new Date().toISOString()
    };

    res.json({
        message: 'Pact updated successfully',
        pact: pacts[pactIndex]
    });
});

app.delete('/api/pacts/:id', authenticateToken, (req, res) => {
    const pactIndex = pacts.findIndex(p => p.id === req.params.id);
    
    if (pactIndex === -1) {
        return res.status(404).json({ error: 'Pact not found' });
    }

    if (pacts[pactIndex].hostId !== req.user.userId) {
        return res.status(403).json({ error: 'Only the host can delete this pact' });
    }

    pacts.splice(pactIndex, 1);

    res.json({ message: 'Pact deleted successfully' });
});

// RSVP routes
app.post('/api/pacts/:id/rsvp', authenticateToken, (req, res) => {
    const { response, plusOnes } = req.body;
    const pactId = req.params.id;

    const pact = pacts.find(p => p.id === pactId);
    if (!pact) {
        return res.status(404).json({ error: 'Pact not found' });
    }

    // Check if user is invited to this pact
    const isInvited = pact.guests.some(guest => guest.email === req.user.email);
    if (!isInvited) {
        return res.status(403).json({ error: 'You are not invited to this pact' });
    }

    // Remove existing RSVP
    rsvps = rsvps.filter(rsvp => !(rsvp.pactId === pactId && rsvp.userEmail === req.user.email));

    // Add new RSVP
    const rsvp = {
        id: uuidv4(),
        pactId,
        userEmail: req.user.email,
        response, // 'confirmed' or 'declined'
        plusOnes: plusOnes || 0,
        respondedAt: new Date().toISOString()
    };

    rsvps.push(rsvp);

    res.json({
        message: 'RSVP recorded successfully',
        rsvp
    });
});

app.get('/api/pacts/:id/rsvps', authenticateToken, (req, res) => {
    const pactId = req.params.id;
    
    const pact = pacts.find(p => p.id === pactId);
    if (!pact) {
        return res.status(404).json({ error: 'Pact not found' });
    }

    // Only host can view all RSVPs
    if (pact.hostId !== req.user.userId) {
        return res.status(403).json({ error: 'Only the host can view RSVPs' });
    }

    const pactRsvps = rsvps.filter(rsvp => rsvp.pactId === pactId);
    res.json(pactRsvps);
});

// Email functions
async function sendInvitations(pact) {
    const host = users.find(u => u.id === pact.hostId);
    
    for (const guest of pact.guests) {
        try {
            const mailOptions = {
                from: process.env.EMAIL_USER || 'your-email@gmail.com',
                to: guest.email,
                subject: `You're invited to ${pact.title}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2>You're invited to ${pact.title}</h2>
                        <p>Hi ${guest.name},</p>
                        <p>${host.name} has invited you to an event:</p>
                        
                        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3>${pact.title}</h3>
                            <p><strong>Date:</strong> ${new Date(pact.date).toLocaleDateString()}</p>
                            <p><strong>Time:</strong> ${pact.time}</p>
                            <p><strong>Location:</strong> ${pact.location}</p>
                            ${pact.description ? `<p><strong>Description:</strong> ${pact.description}</p>` : ''}
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/pact-detail.html?id=${pact.id}" 
                               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                                View Invitation & RSVP
                            </a>
                        </div>
                        
                        <p style="color: #666; font-size: 14px;">
                            This invitation was sent by PlanPact. Please respond by ${pact.rsvpDeadline ? new Date(pact.rsvpDeadline).toLocaleDateString() : 'the event date'}.
                        </p>
                    </div>
                `
            };

            await transporter.sendMail(mailOptions);
        } catch (error) {
            console.error(`Failed to send invitation to ${guest.email}:`, error);
        }
    }
}

async function sendReminders(pact) {
    const confirmedRsvps = rsvps.filter(rsvp => 
        rsvp.pactId === pact.id && rsvp.response === 'confirmed'
    );

    for (const rsvp of confirmedRsvps) {
        try {
            const mailOptions = {
                from: process.env.EMAIL_USER || 'your-email@gmail.com',
                to: rsvp.userEmail,
                subject: `Reminder: ${pact.title} is coming up`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2>Event Reminder</h2>
                        <p>Just a friendly reminder about your upcoming event:</p>
                        
                        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3>${pact.title}</h3>
                            <p><strong>Date:</strong> ${new Date(pact.date).toLocaleDateString()}</p>
                            <p><strong>Time:</strong> ${pact.time}</p>
                            <p><strong>Location:</strong> ${pact.location}</p>
                        </div>
                        
                        <p>We're looking forward to seeing you there!</p>
                    </div>
                `
            };

            await transporter.sendMail(mailOptions);
        } catch (error) {
            console.error(`Failed to send reminder to ${rsvp.userEmail}:`, error);
        }
    }
}

// Serve the main HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/create-pact', (req, res) => {
    res.sendFile(path.join(__dirname, 'create-pact.html'));
});

app.get('/pact-detail', (req, res) => {
    res.sendFile(path.join(__dirname, 'pact-detail.html'));
});

app.get('/pipeline', (req, res) => {
    res.sendFile(path.join(__dirname, 'pipeline.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`PlanPact server is running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to view the application`);
});

module.exports = app;
