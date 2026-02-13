const friendController = require('../controllers/friendController');

async function friendRoutes(fastify, options) {
  const { friendModel, notificationModel } = options;
  const controller = friendController(friendModel, notificationModel);

  // Send a friend request
  fastify.post('/requests', {
    schema: {
      body: {
        type: 'object',
        properties: {
          receiverId: { type: 'integer', minimum: 1 },
          receiver_id: { type: 'integer', minimum: 1 },
          user2_email: { type: 'string', format: 'email', maxLength: 255 }
        }
      }
    },
    preHandler: [fastify.authenticate]
  }, controller.sendRequest);

  // List all friends
  fastify.get('/', {
    preHandler: [fastify.authenticate]
  }, controller.listFriends);

  // List sent requests
  fastify.get('/requests/sent', {
    preHandler: [fastify.authenticate]
  }, controller.listRequestsSent);

  // List received requests
  fastify.get('/requests/received', {
    preHandler: [fastify.authenticate]
  }, controller.listRequestsReceived);

  // List blocked users
  fastify.get('/blocked', {
    preHandler: [fastify.authenticate]
  }, controller.listBlocked);

  // Respond to a request (accept/decline)
  fastify.put('/requests/:friendshipId/respond', {
    schema: {
      params: {
        type: 'object',
        required: ['friendshipId'],
        properties: {
          friendshipId: { type: 'integer', minimum: 1 }
        }
      },
      body: {
        type: 'object',
        required: ['action'],
        properties: {
          action: { type: 'string', enum: ['accept', 'decline'] }
        },
        additionalProperties: false
      }
    },
    preHandler: [fastify.authenticate]
  }, controller.respondRequest);

  // Respond to a request (accept/decline) - also support POST
  fastify.post('/requests/:friendshipId/respond', {
    schema: {
      params: {
        type: 'object',
        required: ['friendshipId'],
        properties: {
          friendshipId: { type: 'integer', minimum: 1 }
        }
      },
      body: {
        type: 'object',
        required: ['action'],
        properties: {
          action: { type: 'string', enum: ['accept', 'decline'] }
        },
        additionalProperties: false
      }
    },
    preHandler: [fastify.authenticate]
  }, controller.respondRequest);

  // Cancel / unfriend
  fastify.delete('/friendships/:friendshipId', {
    schema: {
      params: {
        type: 'object',
        required: ['friendshipId'],
        properties: {
          friendshipId: { type: 'integer', minimum: 1 }
        }
      }
    },
    preHandler: [fastify.authenticate]
  }, controller.abortFriendship);

  // Block a friend
  fastify.post('/:friendId/block', {
    schema: {
      params: {
        type: 'object',
        required: ['friendId'],
        properties: {
          friendId: { type: 'integer', minimum: 1 }
        }
      },
      body: {
        type: 'object',
        properties: {
          friendId: { type: 'integer', minimum: 1 }
        }
      }
    },
    preHandler: [fastify.authenticate]
  }, controller.blockFriend);

  // Unblock a friend
  fastify.post('/:friendId/unblock', {
    schema: {
      params: {
        type: 'object',
        required: ['friendId'],
        properties: {
          friendId: { type: 'integer', minimum: 1 }
        }
      },
      body: {
        type: 'object',
        properties: {
          friendId: { type: 'integer', minimum: 1 }
        }
      }
    },
    preHandler: [fastify.authenticate]
  }, controller.unblockFriend);
}

module.exports = friendRoutes;
