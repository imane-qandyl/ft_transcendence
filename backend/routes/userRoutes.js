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
        const user = request.user?.user || request.user;
        return {
            id: user?.id,
            username: user?.username,
            email: user?.email
        };
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
}

module.exports = userRoutes;
