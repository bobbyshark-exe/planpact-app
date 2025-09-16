const { v4: uuidv4 } = require('uuid');

// In-memory data store to act as our database
let users = [];
let pacts = [];

// --- User Functions ---
const addUser = (name, email, password) => {
    const newUser = { id: uuidv4(), name, email, password };
    users.push(newUser);
    console.log('New user added:', { id: newUser.id, name: newUser.name });
    return newUser;
};

// --- Pact Functions ---
const createPact = (hostId, pactData) => {
    const host = users.find(u => u.id === hostId);
    if (!host) {
        throw new Error('Host user not found');
    }
    const newPact = {
        id: uuidv4(),
        ...pactData,
        host: { id: host.id, name: host.name },
        guests: [
            // Host is automatically a guest and is attending
            { userId: host.id, email: host.email, name: host.name, status: 'attending' },
            // Add invited guests
            ...pactData.guests.map(g => {
                const existingUser = users.find(u => u.email === g.email);
                return { 
                    userId: existingUser ? existingUser.id : null, 
                    email: g.email, 
                    name: existingUser ? existingUser.name : g.email.split('@')[0], // Use name or part of email
                    status: 'pending' 
                };
            })
        ],
        createdAt: new Date().toISOString()
    };
    pacts.push(newPact);
    console.log('New pact created:', { id: newPact.id, title: newPact.title });
    return newPact;
};

const getPactsForUser = (userId) => {
    // A user is involved if their ID matches a guest's userId
    return pacts.filter(pact => pact.guests.some(guest => guest.userId === userId));
};

const rsvpToPact = (userId, pactId, status) => {
    const pact = pacts.find(p => p.id === pactId);
    if (!pact) return null;
    
    const guest = pact.guests.find(g => g.userId === userId);
    if (!guest) return null;

    guest.status = status;
    console.log(`User ${userId} RSVP'd to pact ${pactId} with status ${status}`);
    return pact;
};

// Export all the functions and data arrays to be used by other files
module.exports = { 
    users, 
    pacts, 
    addUser, 
    createPact, 
    getPactsForUser, 
    rsvpToPact 
};

