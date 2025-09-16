const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

// This function is the "security guard"
module.exports = (req, res, next) => {
    // 1. Check for the "keycard" (token) in the request headers
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // If there's no token, deny access
        return res.status(401).json({ message: 'Authentication required: No token provided.' });
    }

    // 2. Extract the token from the "Bearer <token>" string
    const token = authHeader.split(' ')[1];

    try {
        // 3. Verify that the token is valid and not expired
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // 4. If valid, attach the user's ID to the request object for later use
        req.user = { id: decoded.id };
        
        // 5. Allow the request to proceed to its original destination (e.g., the pacts route)
        next();
    } catch (err) {
        // If the token is invalid, deny access
        res.status(401).json({ message: 'Authentication failed: Invalid or expired token.' });
    }
};

