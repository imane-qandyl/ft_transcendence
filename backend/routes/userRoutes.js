const { escapeHtml, sanitizeUrl } = require('../utils/sanitize');

async function userRoutes(fastify, options) {
    const { userModel } = options;

    // Get all users (for admin or user listing)
    fastify.get("/", {
        preHandler: fastify.authenticate
    }, async (request, reply) => {
        try {
            const users = await userModel.getAllUsers();
            return { users };
        } catch (error) {
            console.error('[GET USERS] Error:', error);
            return reply.code(500).send({ error: 'Failed to fetch users' });
        }
    });

    // This route requires authentication
    fastify.get("/profile", {
        preHandler: fastify.authenticate
    }, async (request, reply) => {
        const userId = request.user?.id || request.user?.user?.id;
        return {
            user: userId,
            message: "Protected route accessed successfully"
        };
    });

    fastify.get("/me", {
        preHandler: fastify.authenticate
    }, async (request, reply) => {
        try {
            const userId = request.user?.id || request.user?.user?.id;
            
            if (!userId) {
                return reply.code(401).send({ 
                    error: 'Unauthorized', 
                    message: 'User ID not found in token' 
                });
            }

            // Fetch complete user data from database
            const [user] = await userModel.db("users")
                .where({ id: userId })
                .select('id', 'username', 'email', 'avatar_url', 'twofa_enabled', 'created_at', 'updated_at');

            if (!user) {
                return reply.code(200).send({
                    user: null,
                    message: 'User not found'
                });
            }

            return user;
        } catch (error) {
            console.error('[GET /me] Error:', error);
            return reply.code(500).send({ 
                error: 'Internal Server Error', 
                message: 'Failed to fetch user data' 
            });
        }
    });

    // Search users by username
    fastify.get("/search", {
        schema: {
            querystring: {
                type: 'object',
                properties: {
                    q: { type: 'string', minLength: 1, maxLength: 100 }
                }
            }
        },
        preHandler: fastify.authenticate
    }, async (request, reply) => {
        const { q } = request.query;
        const currentUserId = request.user?.id || request.user?.user?.id;

        if (!q || q.trim().length < 1) {
            return { users: [] };
        }

        try {
            const users = await userModel.searchUsers(q, currentUserId);
            return { users };
        } catch (error) {
            console.error('[USER SEARCH] Error:', error);
            return { users: [], error: error.message };
        }
    });

    // Update user profile (PUT /users/:id)
    fastify.put("/:id", {
        schema: {
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: { type: 'integer', minimum: 1 }
                }
            },
            body: {
                type: 'object',
                properties: {
                    username: { type: 'string', minLength: 3, maxLength: 30, pattern: '^[a-zA-Z0-9_]+$' },
                    email: { type: 'string', format: 'email', maxLength: 255 },
                    avatar_url: { type: 'string', maxLength: 2000000, format: 'uri' },
                    bio: { type: 'string', maxLength: 500 }
                },
                additionalProperties: false
            }
        },
        preHandler: fastify.authenticate
    }, async (request, reply) => {
        try {
            const requestedUserId = parseInt(request.params.id);
            const currentUserId = request.user?.id || request.user?.user?.id;
            
            // Users can only update their own profile
            if (requestedUserId !== currentUserId) {
                return reply.code(403).send({ 
                    error: 'Forbidden', 
                    message: 'You can only update your own profile' 
                });
            }

            // Only allow certain fields to be updated
            const allowedFields = ['avatar_url', 'username', 'email', 'bio'];
            const updateData = {};
            
            for (const field of allowedFields) {
                if (request.body.hasOwnProperty(field)) {
                    updateData[field] = request.body[field];
                }
            }
            
            if (Object.keys(updateData).length === 0) {
                return reply.code(400).send({ 
                    error: 'Bad Request', 
                    message: 'No valid fields to update' 
                });
            }

            // Sanitize text fields to prevent stored XSS
            if (updateData.username) {
                updateData.username = escapeHtml(updateData.username);
            }
            if (updateData.bio) {
                updateData.bio = escapeHtml(updateData.bio);
            }
            if (updateData.avatar_url) {
                const safeUrl = sanitizeUrl(updateData.avatar_url);
                if (!safeUrl) {
                    return reply.code(400).send({
                        error: 'Bad Request',
                        message: 'Invalid avatar URL: only http, https, and data:image/ URLs are allowed'
                    });
                }
                updateData.avatar_url = safeUrl;
            }

            // If email is being updated, ensure it's not used by another user
            if (updateData.email) {
                const existing = await userModel.db('users')
                    .where({ email: updateData.email })
                    .andWhereNot('id', requestedUserId)
                    .first();

                if (existing) {
                    return reply.code(400).send({
                        error: 'Bad Request',
                        message: 'Email already in use by another account'
                    });
                }
            }

            updateData.updated_at = new Date();

            const [updatedUser] = await userModel.db("users")
                .where({ id: requestedUserId })
                .update(updateData)
                .returning('*');

            if (!updatedUser) {
                return reply.code(404).send({ 
                    error: 'Not Found', 
                    message: 'User not found' 
                });
            }

            // Return updated user data (without sensitive fields)
            const { password_hash, twofa_secret, ...safeUserData } = updatedUser;
            return { 
                success: true, 
                user: safeUserData 
            };
        } catch (error) {
            console.error('[UPDATE USER] Error:', error);
            return reply.code(500).send({ 
                error: 'Internal Server Error', 
                message: 'Failed to update user' 
            });
        }
    });
}

module.exports = userRoutes;
