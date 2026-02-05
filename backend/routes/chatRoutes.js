const Chat = require('../models/Chat');
const chatControllerFactory = require('../controllers/chatController');

async function chatRoutes(fastify, options) {
  const { db } = fastify.knex ? { db: fastify.knex } : options;

  // Create model instance using provided db (options.db or fastify.knex)
  const chatModel = new Chat(db || options.db || fastify.knex);
  const controller = chatControllerFactory(chatModel);

  // Create a new chat with another user
  fastify.post('/', { preHandler: [fastify.authenticate] }, controller.createChat);

  // Get all chats for current user
  fastify.get('/', { preHandler: [fastify.authenticate] }, controller.getAllUserChats);

  // Get the chat between current user and another user
  fastify.get('/between/:user2Id', { preHandler: [fastify.authenticate] }, controller.getChatBetweenUsers);

  // Get messages in a chat
  fastify.get('/:chatId/messages', { preHandler: [fastify.authenticate] }, controller.getMessages);

  // Send a message in a chat
  fastify.post('/:chatId/messages', { preHandler: [fastify.authenticate] }, controller.createMessage);

  // Mark messages as read in a chat
  fastify.put('/:chatId/read', { preHandler: [fastify.authenticate] }, controller.markMessagesAsRead);
}

module.exports = chatRoutes;
