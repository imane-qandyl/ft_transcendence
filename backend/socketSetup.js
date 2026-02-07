/**
 * Socket.io Setup for Fastify - Street Pixel Wars
 * Integrates Socket.io with Fastify for real-time game events
 */

const { Server } = require('socket.io');
const GameSocketHandler = require('./socketHandlers/gameHandler');

/**
 * Register Socket.io with Fastify
 */
async function registerSocketIO(fastify) {
  // Create Socket.io server manually and attach to Fastify server
  const io = new Server(fastify.server, {
    cors: {
      origin: process.env.NODE_ENV === 'production'
        ? [process.env.FRONTEND_URL || 'https://localhost:8443']
        : ['https://localhost:8443', `https://${process.env.NETWORK_HOST_IP || '10.18.200.139'}:8443`, '*'],
      credentials: true,
      methods: ['GET', 'POST']
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true
  });

  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      // Verify JWT token using fastify's JWT instance
      const decoded = await fastify.jwt.verify(token);

      // Attach user to socket
      socket.user = decoded;
      next();
    } catch (error) {
      console.error('Socket authentication error:', error.message);
      next(new Error('Invalid authentication token'));
    }
  });

  // Create game socket handler
  const gameHandler = new GameSocketHandler(io);

  // Handle connections
  io.on('connection', (socket) => {
    // Initialize game event handlers
    gameHandler.initialize(socket);

    socket.on('disconnect', () => {
      // Handle cleanup if needed
    });
  });

  // Attach io to fastify for easy access
  fastify.decorate('io', io);
}

module.exports = registerSocketIO;
