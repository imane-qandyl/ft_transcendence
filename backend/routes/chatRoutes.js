const Chat = require('../models/Chat');
const chatControllerFactory = require('../controllers/chatController');

async function chatRoutes(fastify, options) {
  const { db } = fastify.knex ? { db: fastify.knex } : options;

  // Create model instance using provided db (options.db or fastify.knex)
  const chatModel = new Chat(db || options.db || fastify.knex);
  const controller = chatControllerFactory(chatModel);

  // Create a new chat with another user
  fastify.post('/', {
    schema: {
      body: {
        type: 'object',
        required: ['user2_id'],
        properties: {
          user2_id: { type: 'integer', minimum: 1 }
        },
        additionalProperties: false
      }
    },
    preHandler: [fastify.authenticate]
  }, controller.createChat);

  // Get all chats for current user
  fastify.get('/', { preHandler: [fastify.authenticate] }, controller.getAllUserChats);

  // Get the chat between current user and another user
  fastify.get('/between/:user2Id', {
    schema: {
      params: {
        type: 'object',
        required: ['user2Id'],
        properties: {
          user2Id: { type: 'integer', minimum: 1 }
        }
      }
    },
    preHandler: [fastify.authenticate]
  }, controller.getChatBetweenUsers);

  // Get messages in a chat
  fastify.get('/:chatId/messages', {
    schema: {
      params: {
        type: 'object',
        required: ['chatId'],
        properties: {
          chatId: { type: 'integer', minimum: 1 }
        }
      }
    },
    preHandler: [fastify.authenticate]
  }, controller.getMessages);

  // Send a message in a chat
  fastify.post('/:chatId/messages', {
    schema: {
      params: {
        type: 'object',
        required: ['chatId'],
        properties: {
          chatId: { type: 'integer', minimum: 1 }
        }
      },
      body: {
        type: 'object',
        required: ['content'],
        properties: {
          content: { type: 'string', minLength: 1, maxLength: 5000 }
        },
        additionalProperties: false
      }
    },
    preHandler: [fastify.authenticate]
  }, controller.createMessage);

  // Mark messages as read in a chat
  fastify.put('/:chatId/read', {
    schema: {
      params: {
        type: 'object',
        required: ['chatId'],
        properties: {
          chatId: { type: 'integer', minimum: 1 }
        }
      }
    },
    preHandler: [fastify.authenticate]
  }, controller.markMessagesAsRead);
}

module.exports = chatRoutes;
