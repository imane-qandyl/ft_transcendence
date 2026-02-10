const fastify = require("fastify")({
	logger: process.env.NODE_ENV === 'production' ? {
		level: process.env.LOG_LEVEL || "info"
	} : {
		level: process.env.LOG_LEVEL || "info"
	},
	bodyLimit: 10 * 1024 * 1024, // 10MB limit for file uploads
});

// Import middleware
const { globalErrorHandler, notFoundHandler } = require("./middleware/errorHandler");
const { authenticate } = require("./middleware/auth");

// Import routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const notificationRoutes = require("./routes/notifications");
const matchRoutes = require("./routes/matchRoutes");
const chatRoutes = require("./routes/chatRoutes");
const wsChatRoutes = require("./routes/wsChatRoutes");
const friendRoutes = require("./routes/friendRoutes");
const characterRoutes = require("./routes/characterRoutes");

// Import models
const User = require("./models/User");
const db = require("./db");

// Import Socket.io setup
const registerSocketIO = require("./socketSetup");

const start = async () => {
	try {
		await db.migrate.latest();

		// Register CORS plugin
		await fastify.register(require('@fastify/cors'), {
			origin: process.env.NODE_ENV === 'production' 
				? [process.env.FRONTEND_URL || 'http://localhost:3000']
				: [
					'http://localhost:3001',
					'https://localhost:8443',
					'http://localhost:3000'
				], // Allow frontend and dev origins
			credentials: true,
			methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
		});

		// Register rate limiting plugin
		await fastify.register(require('@fastify/rate-limit'), {
			max: 100, // requests
			timeWindow: '1 minute',
			errorResponseBuilder: function (request, context) {
				return {
					error: 'Too Many Requests',
					message: `Rate limit exceeded, retry in ${context.ttl} seconds`,
					statusCode: 429,
					retryAfter: Math.round(context.ttl / 1000)
				};
			}
		});

		// Register Swagger UI plugin
		await fastify.register(require('@fastify/swagger'), {
			openapi: {
				openapi: '3.0.0',
				info: {
					title: 'ft_transcendence API',
					version: '1.0.0',
					description: 'API documentation for ft_transcendence'
				},
				servers: [
					{
						url: `http://localhost:3000`,
						description: 'Local development server'
					}
				]
			}
		});

		// Register Swagger UI
		await fastify.register(require('@fastify/swagger-ui'), {
			routePrefix: '/docs'
		});

		// Register JWT plugin
		await fastify.register(require('@fastify/jwt'), {
			secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production'
		});

		// Register cookie plugin for session management
		await fastify.register(require('@fastify/cookie'), {
			secret: process.env.COOKIE_SECRET || 'cookie-secret-change-in-production',
			parseOptions: {}
		});

		// Register Socket.io for real-time game communication
		await registerSocketIO(fastify);

		// Add global error handler
		fastify.setErrorHandler(globalErrorHandler);
		fastify.setNotFoundHandler(notFoundHandler);

		// Add authenticate decorator using our middleware
		fastify.decorate('authenticate', authenticate);

		// Add knex instance to fastify for easy access
		fastify.decorate('knex', db);

		// Health check endpoint
		fastify.get('/health', async (request, reply) => {
			try {
				// Test database connection
				await db.raw('SELECT 1');
				return {
					status: 'healthy',
					timestamp: new Date().toISOString(),
					uptime: process.uptime(),
					version: process.env.npm_package_version || '1.0.0'
				};
			} catch (error) {
				return reply.code(503).send({
					status: 'unhealthy',
					error: error.message,
					timestamp: new Date().toISOString()
				});
			}
		});

		// Create model instances
		const userModel = new User(db);

		// Register routes with proper error handling
		fastify.register(authRoutes, {
			userModel,
			prefix: "/api/v1/auth",
		});

		fastify.register(userRoutes, {
			prefix: "/api/v1/users",
			userModel,
		});

		fastify.register(matchRoutes, {
			prefix: "/api/v1/matches",
			db: db,
		});

		const Notification = require("./models/Notification");
		const notificationModel = new Notification(db);
		
		fastify.register(notificationRoutes, {
			prefix: "/api/v1/notifications",
			notificationModel: notificationModel,
		});

		// Register friend routes
		const Friend = require("./models/Friend");
		const friendModel = new Friend(db);
		fastify.register(friendRoutes, {
			prefix: "/api/v1/friends",
			friendModel,
			notificationModel,
		});

		// Register chat routes
		fastify.register(chatRoutes, {
			prefix: "/api/v1/chats",
			db: db,
		});

		// Register WebSocket chat routes
		fastify.register(wsChatRoutes);

		// Register character routes
		fastify.register(characterRoutes, {
			prefix: "/api/v1/characters",
			db: db,
		});

		// Add stricter rate limiting for auth endpoints
		fastify.register(async function (fastify) {
			await fastify.register(require('@fastify/rate-limit'), {
				max: 5, // 5 requests
				timeWindow: '1 minute',
				keyGenerator: function (request) {
					return request.ip + ':auth';
				}
			});
		}, { prefix: '/api/v1/auth' });

		const address = await fastify.listen({
			port: process.env.PORT || 3000,
			host: process.env.HOST || "0.0.0.0",
		});
		
		fastify.log.info(`Server listening on ${address}`);
	} catch (err) {
		fastify.log.error('Failed to start server:', err);
		process.exit(1);
	}
};

start();