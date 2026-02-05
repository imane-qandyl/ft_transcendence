
async function authRoutes(fastify, options) {
    const { userModel } = options;

    const {register, login} = require("../controllers/authController")(userModel);
    const { loginHandler, googleAuthHandler, refreshTokenHandler } = require("../controllers/authController");

	// Basic auth endpoints
	fastify.post("/register", register);
	fastify.post("/login", login);
	
	// Advanced auth endpoints with proper JWT handling
	fastify.post("/login-jwt", async (request, reply) => {
		await loginHandler(fastify, request, reply);
	});

	fastify.post("/google", async (request, reply) => {
		await googleAuthHandler(fastify, request, reply);
	});
	
	// Refresh token endpoint
	fastify.post("/refresh", async (request, reply) => {
		await refreshTokenHandler(fastify, request, reply);
	});
	
	// Logout endpoint
	fastify.post("/logout", {
		preHandler: [fastify.authenticate]
	}, async (request, reply) => {
		const { deviceId } = request.body;
		
		if (deviceId) {
			// Invalidate refresh tokens for this device
			await fastify.knex("refresh_tokens")
				.update({ is_valid: false })
				.where({ 
					user_id: request.user.id || request.user.user?.id,
					device_id: deviceId 
				});
		} else {
			// Invalidate all refresh tokens for this user
			await fastify.knex("refresh_tokens")
				.update({ is_valid: false })
				.where({ user_id: request.user.id || request.user.user?.id });
		}
		
		reply.send({ message: "Logged out successfully" });
	});

	// Get user profile
	fastify.post("/profile", {
		preHandler: [fastify.authenticate]
	}, async (request, reply) => {
		const user = request.user?.user || request.user;
		reply.send({
			success: true,
			data: {
				id: user?.id,
				username: user?.username,
				email: user?.email
			}
		});
	});

	// Get current user info
	fastify.post("/me", {
		preHandler: [fastify.authenticate]
	}, async (request, reply) => {
		const user = request.user?.user || request.user;
		reply.send({
			success: true,
			data: {
				id: user?.id,
				username: user?.username,
				email: user?.email
			}
		});
	});
}

module.exports = authRoutes;