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
                return reply.code(404).send({ 
                    error: 'Not Found', 
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
            const allowedFields = ['avatar_url', 'username', 'bio'];
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
