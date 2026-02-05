const { BadRequestError } = require('../errors');

/**
 * Input validation schemas for common endpoints
 */
const schemas = {
    // Auth schemas
    register: {
        body: {
            type: 'object',
            required: ['username', 'email', 'password'],
            properties: {
                username: {
                    type: 'string',
                    minLength: 3,
                    maxLength: 50,
                    pattern: '^[a-zA-Z0-9_-]+$'
                },
                email: {
                    type: 'string',
                    format: 'email',
                    maxLength: 255
                },
                password: {
                    type: 'string',
                    minLength: 8,
                    maxLength: 128
                }
            },
            additionalProperties: false
        }
    },
    
    login: {
        body: {
            type: 'object',
            required: ['email', 'password'],
            properties: {
                email: {
                    type: 'string',
                    format: 'email'
                },
                password: {
                    type: 'string',
                    minLength: 1
                },
                deviceId: {
                    type: 'string',
                    minLength: 1
                }
            },
            additionalProperties: false
        }
    },
    
    googleAuth: {
        body: {
            type: 'object',
            required: ['token', 'deviceId'],
            properties: {
                token: {
                    type: 'string',
                    minLength: 1
                },
                deviceId: {
                    type: 'string',
                    minLength: 1
                }
            },
            additionalProperties: false
        }
    },
    
    refreshToken: {
        body: {
            type: 'object',
            required: ['refreshToken', 'deviceId'],
            properties: {
                refreshToken: {
                    type: 'string',
                    minLength: 1
                },
                deviceId: {
                    type: 'string',
                    minLength: 1
                }
            },
            additionalProperties: false
        }
    },
    
    // User schemas
    updateProfile: {
        body: {
            type: 'object',
            properties: {
                username: {
                    type: 'string',
                    minLength: 3,
                    maxLength: 50,
                    pattern: '^[a-zA-Z0-9_-]+$'
                },
                email: {
                    type: 'string',
                    format: 'email',
                    maxLength: 255
                },
                avatar_url: {
                    type: 'string',
                    format: 'uri',
                    maxLength: 500
                }
            },
            additionalProperties: false,
            minProperties: 1
        }
    },
    
    // Chat schemas
    createChat: {
        body: {
            type: 'object',
            required: ['participantId'],
            properties: {
                participantId: {
                    type: 'integer',
                    minimum: 1
                }
            },
            additionalProperties: false
        }
    },
    
    sendMessage: {
        body: {
            type: 'object',
            required: ['content'],
            properties: {
                content: {
                    type: 'string',
                    minLength: 1,
                    maxLength: 1000
                }
            },
            additionalProperties: false
        }
    },
    
    // Friend schemas
    sendFriendRequest: {
        body: {
            type: 'object',
            required: ['friendId'],
            properties: {
                friendId: {
                    type: 'integer',
                    minimum: 1
                }
            },
            additionalProperties: false
        }
    },
    
    respondToFriendRequest: {
        body: {
            type: 'object',
            required: ['action'],
            properties: {
                action: {
                    type: 'string',
                    enum: ['accept', 'decline']
                }
            },
            additionalProperties: false
        }
    },
    
    // Common parameter schemas
    idParam: {
        params: {
            type: 'object',
            required: ['id'],
            properties: {
                id: {
                    type: 'string',
                    pattern: '^[0-9]+$'
                }
            }
        }
    },
    
    pagination: {
        querystring: {
            type: 'object',
            properties: {
                page: {
                    type: 'integer',
                    minimum: 1,
                    default: 1
                },
                limit: {
                    type: 'integer',
                    minimum: 1,
                    maximum: 100,
                    default: 20
                }
            }
        }
    }
};

/**
 * Sanitize input to prevent XSS attacks
 */
function sanitizeInput(obj) {
    if (typeof obj === 'string') {
        return obj
            .replace(/[<>]/g, '') // Remove < and > characters
            .trim();
    }
    
    if (Array.isArray(obj)) {
        return obj.map(sanitizeInput);
    }
    
    if (obj && typeof obj === 'object') {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            sanitized[key] = sanitizeInput(value);
        }
        return sanitized;
    }
    
    return obj;
}

/**
 * Validation middleware factory
 */
function createValidation(schemaName) {
    const schema = schemas[schemaName];
    if (!schema) {
        throw new Error(`Validation schema '${schemaName}' not found`);
    }
    
    return {
        schema,
        preHandler: async function(request, reply) {
            // Sanitize inputs
            if (request.body) {
                request.body = sanitizeInput(request.body);
            }
            if (request.query) {
                request.query = sanitizeInput(request.query);
            }
            if (request.params) {
                request.params = sanitizeInput(request.params);
            }
        }
    };
}

/**
 * Custom validation error handler
 */
function validationErrorHandler(error, request, reply) {
    if (error.validation) {
        const message = error.validation.map(err => {
            const field = err.instancePath.replace('/', '') || err.params?.missingProperty || 'field';
            return `${field}: ${err.message}`;
        }).join(', ');
        
        return reply.code(400).send({
            error: 'Validation Error',
            message: `Invalid input: ${message}`,
            details: error.validation
        });
    }
    
    // Re-throw non-validation errors
    throw error;
}

module.exports = {
    schemas,
    createValidation,
    sanitizeInput,
    validationErrorHandler
};