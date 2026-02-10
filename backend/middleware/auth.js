const { UnauthorizedError } = require('../errors');

/**
 * Authentication middleware for Fastify
 * Verifies JWT tokens from Authorization header
 */
async function authenticate(request, reply) {
    try {
        const authHeader = request.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedError('Missing or invalid Authorization header');
        }
        
        const token = authHeader.substring(7);
        const decoded = request.server.jwt.verify(token);
        
        // Attach user info to request
        request.user = decoded;
        
    } catch (err) {
        if (err.name === 'JsonWebTokenError') {
            throw new UnauthorizedError('Invalid JWT token');
        } else if (err.name === 'TokenExpiredError') {
            throw new UnauthorizedError('JWT token has expired');
        } else if (err.statusCode) {
            throw err; // Re-throw our custom errors
        } else {
            throw new UnauthorizedError('Authentication failed');
        }
    }
}

module.exports = {
    authenticate
};