const CustomError = require('../errors');

module.exports = (friendModel, notificationModel = null) => ({
  sendRequest: async (request, reply) => {
    try {
      if (!request.user || !request.user.id) {
        return reply.code(401).send({ success: false, message: 'User authentication required' });
      }

      const senderId = request.user.id;
      let receiverId = request.body.receiverId || request.body.receiver_id;
      const receiverEmail = request.body.user2_email;

      // If email is provided instead of ID, look up the user
      if (!receiverId && receiverEmail) {
        const receiverUser = await request.server.knex('users')
          .where({ email: receiverEmail })
          .first();
        
        if (!receiverUser) {
          return reply.code(404).send({ success: false, message: 'User not found with that email address' });
        }
        
        receiverId = receiverUser.id;
      }

      if (!receiverId) {
        return reply.code(400).send({ success: false, message: 'receiverId or user2_email is required' });
      }

      const notify = await friendModel.sendRequest(senderId, parseInt(receiverId, 10));

      // Create a notification if requested and notificationModel available
      if (notify && notificationModel) {
        try {
          const senderUsername = request.user.username || 'Someone';
          await notificationModel.createNotification(
            senderId,
            parseInt(receiverId, 10),
            null,
            'friend_request',
            `${senderUsername} sent you a friend request`
          );
        } catch (e) {
          // don't fail the request if notification creation fails
          request.log && request.log.error('Failed to create friend request notification', e.message);
        }
      }

      return reply.code(201).send({ success: true, notify });
    } catch (error) {
      if (error instanceof CustomError.BadRequestError) return reply.code(400).send({ success: false, message: error.message });
      if (error instanceof CustomError.NotFoundError) return reply.code(404).send({ success: false, message: error.message });
      if (error instanceof CustomError.UnauthorizedError) return reply.code(403).send({ success: false, message: error.message });

      request.log && request.log.error(error);
      return reply.code(500).send({ success: false, message: 'Failed to send friend request', error: error.message });
    }
  },

  listFriends: async (request, reply) => {
    try {
      if (!request.user || !request.user.id) {
        return reply.code(401).send({ success: false, message: 'User authentication required' });
      }

      const userId = request.user.id;
      const friends = await friendModel.listFriends(userId);

      return reply.send({ success: true, data: friends });
    } catch (error) {
      request.log && request.log.error(error);
      return reply.code(500).send({ success: false, message: 'Failed to list friends', error: error.message });
    }
  },

  listRequestsSent: async (request, reply) => {
    try {
      if (!request.user || !request.user.id) {
        return reply.code(401).send({ success: false, message: 'User authentication required' });
      }

      const userId = request.user.id;
      const requests = await friendModel.listRequests(userId, 'pending', 'sent');

      return reply.send({ success: true, data: requests });
    } catch (error) {
      request.log && request.log.error(error);
      return reply.code(500).send({ success: false, message: 'Failed to list sent requests', error: error.message });
    }
  },

  listRequestsReceived: async (request, reply) => {
    try {
      if (!request.user || !request.user.id) {
        return reply.code(401).send({ success: false, message: 'User authentication required' });
      }

      const userId = request.user.id;
      const requests = await friendModel.listRequests(userId, 'pending', 'received');

      return reply.send({ success: true, data: requests });
    } catch (error) {
      request.log && request.log.error(error);
      return reply.code(500).send({ success: false, message: 'Failed to list received requests', error: error.message });
    }
  },

  respondRequest: async (request, reply) => {
    try {
      if (!request.user || !request.user.id) {
        return reply.code(401).send({ success: false, message: 'User authentication required' });
      }

      const receiverId = request.user.id;
      const friendshipId = request.params.friendshipId;
      const { action } = request.body; // 'accept' or 'decline'

      if (!friendshipId) return reply.code(400).send({ success: false, message: 'friendshipId is required' });
      if (!action || !['accept', 'decline'].includes(action)) return reply.code(400).send({ success: false, message: 'action must be "accept" or "decline"' });

      const { senderUser, status } = await friendModel.handleRequest(parseInt(friendshipId, 10), receiverId, action);

      // Notifications: remove pending request and notify acceptance
      if (notificationModel) {
        try {
          await notificationModel.deleteNotification(senderUser.id, receiverId, 'friend_request');
          if (status === 'accepted') {
            await notificationModel.createNotification(receiverId, senderUser.id, null, 'friend_accept', `${request.user.username || 'Someone'} accepted your friend request`);
          }
        } catch (e) {
          request.log && request.log.error('Notification handling failed', e.message);
        }
      }

      return reply.send({ success: true, sender: senderUser, status });
    } catch (error) {
      if (error instanceof CustomError.BadRequestError) return reply.code(400).send({ success: false, message: error.message });
      if (error instanceof CustomError.NotFoundError) return reply.code(404).send({ success: false, message: error.message });
      if (error instanceof CustomError.UnauthorizedError) return reply.code(403).send({ success: false, message: error.message });

      request.log && request.log.error(error);
      return reply.code(500).send({ success: false, message: 'Failed to respond to friend request', error: error.message });
    }
  },

  abortFriendship: async (request, reply) => {
    try {
      if (!request.user || !request.user.id) {
        return reply.code(401).send({ success: false, message: 'User authentication required' });
      }

      const userId = request.user.id;
      const friendshipId = request.params.friendshipId;

      if (!friendshipId) return reply.code(400).send({ success: false, message: 'friendshipId is required' });

      const exFriendId = await friendModel.abortFriendship(parseInt(friendshipId, 10), userId);

      // cleanup bilateral notifications between the two users
      if (notificationModel && exFriendId) {
        try {
          await notificationModel.deleteAllBilateralNotifications(userId, exFriendId, 'friend_request');
          await notificationModel.deleteAllBilateralNotifications(userId, exFriendId, 'friend_accept');
        } catch (e) {
          request.log && request.log.error('Notification cleanup failed', e.message);
        }
      }

      return reply.send({ success: true, exFriendId });
    } catch (error) {
      if (error instanceof CustomError.BadRequestError) return reply.code(400).send({ success: false, message: error.message });
      if (error instanceof CustomError.NotFoundError) return reply.code(404).send({ success: false, message: error.message });
      if (error instanceof CustomError.UnauthorizedError) return reply.code(403).send({ success: false, message: error.message });

      request.log && request.log.error(error);
      return reply.code(500).send({ success: false, message: 'Failed to abort friendship', error: error.message });
    }
  },

  blockFriend: async (request, reply) => {
    try {
      if (!request.user || !request.user.id) {
        return reply.code(401).send({ success: false, message: 'User authentication required' });
      }

      const userId = request.user.id;
      const friendToBlockId = request.body.friendId || request.params.friendId;

      if (!friendToBlockId) {
        return reply.code(400).send({ success: false, message: 'friendId is required' });
      }

      const blockedUserId = await friendModel.blockFriend(userId, parseInt(friendToBlockId, 10));

      return reply.send({ success: true, blockedUserId });
    } catch (error) {
      if (error instanceof CustomError.BadRequestError) return reply.code(400).send({ success: false, message: error.message });
      if (error instanceof CustomError.NotFoundError) return reply.code(404).send({ success: false, message: error.message });
      if (error instanceof CustomError.UnauthorizedError) return reply.code(403).send({ success: false, message: error.message });

      request.log && request.log.error(error);
      return reply.code(500).send({ success: false, message: 'Failed to block friend', error: error.message });
    }
  },

  unblockFriend: async (request, reply) => {
    try {
      if (!request.user || !request.user.id) {
        return reply.code(401).send({ success: false, message: 'User authentication required' });
      }

      const userId = request.user.id;
      const friendToUnblockId = request.body.friendId || request.params.friendId;

      if (!friendToUnblockId) {
        return reply.code(400).send({ success: false, message: 'friendId is required' });
      }

      const unblockedUserId = await friendModel.unblockFriend(userId, parseInt(friendToUnblockId, 10));

      return reply.send({ success: true, unblockedUserId });
    } catch (error) {
      if (error instanceof CustomError.BadRequestError) return reply.code(400).send({ success: false, message: error.message });
      if (error instanceof CustomError.NotFoundError) return reply.code(404).send({ success: false, message: error.message });
      if (error instanceof CustomError.UnauthorizedError) return reply.code(403).send({ success: false, message: error.message });

      request.log && request.log.error(error);
      return reply.code(500).send({ success: false, message: 'Failed to unblock friend', error: error.message });
    }
  },

  listBlocked: async (request, reply) => {
    try {
      if (!request.user || !request.user.id) {
        return reply.code(401).send({ success: false, message: 'User authentication required' });
      }

      const userId = request.user.id;
      const blockedUsers = await friendModel.listBlockedUsers(userId);

      return reply.send({ success: true, data: blockedUsers });
    } catch (error) {
      request.log && request.log.error(error);
      return reply.code(500).send({ success: false, message: 'Failed to list blocked users', error: error.message });
    }
  }
});
