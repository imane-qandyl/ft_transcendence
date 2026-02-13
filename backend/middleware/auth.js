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

/**
 * Optional authentication middleware
 * Sets request.user if valid token is provided, but doesn't fail if missing
 */
async function optionalAuth(request, reply) {
    try {
        const authHeader = request.headers.authorization;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const decoded = request.server.jwt.verify(token);
            request.user = decoded;
        }
        // If no token or invalid token, just continue without setting request.user
    } catch (err) {
        // Silently ignore auth errors for optional auth
        request.user = null;
    }
}

/**
 * Rate limiting middleware factory
 * @param {number} maxRequests - Maximum requests per window
 * @param {number} windowMs - Time window in milliseconds
 */
function createRateLimit(maxRequests = 100, windowMs = 15 * 60 * 1000) {
    const requests = new Map();
    
    return async function rateLimit(request, reply) {
        const clientId = request.ip || 'unknown';
        const now = Date.now();
        const windowStart = now - windowMs;
        
        // Clean old entries
        if (requests.has(clientId)) {
            const clientRequests = requests.get(clientId);
            const validRequests = clientRequests.filter(time => time > windowStart);
            requests.set(clientId, validRequests);
        }
        
        // Get current request count
        const clientRequests = requests.get(clientId) || [];
        
        if (clientRequests.length >= maxRequests) {
            return reply.code(429).send({
                error: 'Too Many Requests',
                message: `Rate limit exceeded. Try again in ${Math.ceil(windowMs / 1000)} seconds.`,
                retryAfter: Math.ceil(windowMs / 1000)
            });
        }
        
        // Add current request
        clientRequests.push(now);
        requests.set(clientId, clientRequests);
    };
}

module.exports = {
    authenticate,
    optionalAuth,
    createRateLimit
};