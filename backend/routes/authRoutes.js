
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

	// 2FA Endpoints
	fastify.post("/2fa/enable", {
		preHandler: [fastify.authenticate]
	}, async (request, reply) => {
		try {
			const userId = request.user?.id || request.user?.user?.id;
			const result = await userModel.enable2FA(userId);
			reply.send({
				success: true,
				data: result
			});
		} catch (error) {
			console.error('Enable 2FA error:', error);
			reply.code(500).send({
				success: false,
				message: 'Failed to enable 2FA'
			});
		}
	});

	fastify.post("/2fa/verify", {
		preHandler: [fastify.authenticate]
	}, async (request, reply) => {
		try {
			const userId = request.user?.id || request.user?.user?.id;
			const { token } = request.body;
			
			if (!token) {
				return reply.code(400).send({
					success: false,
					message: '2FA token is required'
				});
			}

			await userModel.verify2FA(userId, token);
			reply.send({
				success: true,
				message: '2FA verified successfully'
			});
		} catch (error) {
			console.error('Verify 2FA error:', error);
			reply.code(401).send({
				success: false,
				message: error.message || 'Invalid 2FA code'
			});
		}
	});

	fastify.post("/2fa/disable", {
		preHandler: [fastify.authenticate]
	}, async (request, reply) => {
		try {
			const userId = request.user?.id || request.user?.user?.id;
			const { token } = request.body;
			
			if (!token) {
				return reply.code(400).send({
					success: false,
					message: '2FA token required to disable 2FA'
				});
			}

			// Verify current 2FA before disabling
			await userModel.verify2FA(userId, token);
			await userModel.disable2FA(userId);
			
			reply.send({
				success: true,
				message: '2FA disabled successfully'
			});
		} catch (error) {
			console.error('Disable 2FA error:', error);
			reply.code(401).send({
				success: false,
				message: error.message || 'Invalid 2FA code'
			});
		}
	});

	// Check 2FA status
	fastify.get("/2fa/status", {
		preHandler: [fastify.authenticate]
	}, async (request, reply) => {
		try {
			const userId = request.user?.id || request.user?.user?.id;
			console.log('2FA Status check for user ID:', userId);
			
			if (!userId) {
				return reply.code(401).send({
					success: false,
					message: 'User ID not found in token'
				});
			}
			
			const user = await fastify.knex('users').where('id', userId).first();
			
			if (!user) {
				return reply.code(404).send({
					success: false,
					message: 'User not found'
				});
			}
			
			reply.send({
				success: true,
				data: {
					enabled: !!user.twofa_enabled
				}
			});
		} catch (error) {
			console.error('Get 2FA status error:', error);
			reply.code(500).send({
				success: false,
				message: 'Failed to get 2FA status'
			});
		}
	});
}

module.exports = authRoutes;