const { CustomError } = require('../errors');

/**
 * Global error handler for Fastify
 * Handles all errors consistently across the application
 */
function globalErrorHandler(error, request, reply) {
    // Log error details (in production, use proper logging service)
    const errorInfo = {
        message: error.message,
        stack: error.stack,
        url: request.url,
        method: request.method,
        ip: request.ip,
        userAgent: request.headers['user-agent'],
        userId: request.user?.id || 'anonymous',
        timestamp: new Date().toISOString()
    };
    
    // Log based on error severity
    if (error.statusCode >= 500 || !error.statusCode) {
        request.log.error(errorInfo, 'Server Error');
    } else if (error.statusCode >= 400) {
        request.log.warn(errorInfo, 'Client Error');
    }
    
    // Handle validation errors
    if (error.validation) {
        const message = error.validation.map(err => {
            const field = err.instancePath.replace('/', '') || err.params?.missingProperty || 'field';
            return `${field}: ${err.message}`;
        }).join(', ');
        
        return reply.code(400).send({
            error: 'Validation Error',
            message: `Invalid input: ${message}`,
            statusCode: 400
        });
    }
    
    // Handle JWT errors
    if (error.name === 'JsonWebTokenError') {
        return reply.code(401).send({
            error: 'Unauthorized',
            message: 'Invalid JWT token',
            statusCode: 401
        });
    }
    
    if (error.name === 'TokenExpiredError') {
        return reply.code(401).send({
            error: 'Unauthorized',
            message: 'JWT token has expired',
            statusCode: 401
        });
    }
    
    // Handle custom application errors
    if (error instanceof CustomError || error.statusCode) {
        return reply.code(error.statusCode || 500).send({
            error: error.name || 'Error',
            message: error.message,
            statusCode: error.statusCode || 500
        });
    }
    
    // Handle database errors
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return reply.code(409).send({
            error: 'Conflict',
            message: 'Resource already exists',
            statusCode: 409
        });
    }
    
    if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
        return reply.code(400).send({
            error: 'Bad Request',
            message: 'Invalid reference to related resource',
            statusCode: 400
        });
    }
    
    // Handle rate limiting errors
    if (error.statusCode === 429) {
        return reply.code(429).send({
            error: 'Too Many Requests',
            message: error.message || 'Rate limit exceeded',
            statusCode: 429,
            retryAfter: error.retryAfter || 60
        });
    }
    
    // Handle unexpected errors
    return reply.code(500).send({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'production' 
            ? 'An unexpected error occurred' 
            : error.message,
        statusCode: 500
    });
}

/**
 * Not found handler for undefined routes
 */
function notFoundHandler(request, reply) {
    return reply.code(404).send({
        error: 'Not Found',
        message: `Route ${request.method} ${request.url} not found`,
        statusCode: 404
    });
}

module.exports = {
    globalErrorHandler,
    notFoundHandler
};