const CustomError = require('../errors');
const { escapeHtml } = require('../utils/sanitize');

module.exports = (chatModel) => ({
  createChat: async (request, reply) => {
    try {
      if (!request.user || !request.user.id) {
        return reply.status(401).send({ success: false, message: 'User authentication required' });
      }

      const user1Id = request.user.id;
      const { user2_id } = request.body;

      if (!user2_id) {
        return reply.status(400).send({ success: false, message: 'user2_id is required' });
      }

      const createdChatId = await chatModel.createChatBetweenUsers(user1Id, user2_id);

      return reply.code(201).send({ success: true, chat_id: createdChatId });
    } catch (error) {
      // propagate known errors with friendly status
      if (error instanceof CustomError.BadRequestError) {
        return reply.code(400).send({ success: false, message: error.message });
      }
      if (error instanceof CustomError.NotFoundError) {
        return reply.code(404).send({ success: false, message: error.message });
      }

      request.log && request.log.error(error);
      return reply.code(500).send({ success: false, message: 'Failed to create chat' });
    }
  },

  getAllUserChats: async (request, reply) => {
    try {
      if (!request.user || !request.user.id) {
        return reply.status(401).send({ success: false, message: 'User authentication required' });
      }

      const userId = request.user.id;
      const chats = await chatModel.getAllUserChats(userId);

      return reply.send({ success: true, chats: chats });
    } catch (error) {
      request.log && request.log.error(error);
      return reply.code(500).send({ success: false, message: 'Failed to fetch chats' });
    }
  },

  getChatBetweenUsers: async (request, reply) => {
    try {
      if (!request.user || !request.user.id) {
        return reply.status(401).send({ success: false, message: 'User authentication required' });
      }

      const user1Id = request.user.id;
      const { user2Id } = request.params;

      if (!user2Id) {
        return reply.code(400).send({ success: false, message: 'user2Id is required' });
      }

      let chatId;
      try {
        // Try to get existing chat
        chatId = await chatModel.getChatBetweenUsers(user1Id, user2Id);
      } catch (error) {
        if (error instanceof CustomError.NotFoundError) {
          // Chat doesn't exist, create it automatically
          request.log && request.log.info(`Chat not found between ${user1Id} and ${user2Id}, creating new chat`);
          try {
            chatId = await chatModel.createChatBetweenUsers(user1Id, user2Id);
            request.log && request.log.info(`Created new chat: ${chatId}`);
          } catch (createError) {
            // If create fails with BadRequestError (chat already exists), try to get it again
            if (createError instanceof CustomError.BadRequestError && createError.message.includes('already exists')) {
              request.log && request.log.warn(`Chat create conflict - trying to fetch again: ${createError.message}`);
              try {
                chatId = await chatModel.getChatBetweenUsers(user1Id, user2Id);
              } catch (fetchError) {
                request.log && request.log.error(`Could not fetch chat after conflict: ${fetchError.message}`);
                throw createError;
              }
            } else {
              throw createError;
            }
          }
        } else {
          throw error;
        }
      }
      
      return reply.send({ success: true, chat_id: chatId });
    } catch (error) {
      if (error instanceof CustomError.NotFoundError) {
        return reply.code(404).send({ success: false, message: error.message });
      }
      if (error instanceof CustomError.BadRequestError) {
        // Chat already exists or other bad request - return error
        return reply.code(400).send({ success: false, message: error.message });
      }
      
      request.log && request.log.error(error);
      return reply.code(500).send({ success: false, message: 'Failed to get chat', error: error.message });
    }
  },

  createMessage: async (request, reply) => {
    try {
      if (!request.user || !request.user.id) {
        return reply.status(401).send({ success: false, message: 'User authentication required' });
      }

      const senderId = request.user.id;
      const { chatId } = request.params;
      const { content } = request.body;

      if (!chatId) {
        return reply.code(400).send({ success: false, message: 'chatId is required' });
      }

      if (!content || typeof content !== 'string') {
        return reply.code(400).send({ success: false, message: 'content is required' });
      }

      const trimmedContent = content.trim();
      if (trimmedContent.length === 0) {
        return reply.code(400).send({ success: false, message: 'content cannot be empty' });
      }
      if (trimmedContent.length > 5000) {
        return reply.code(400).send({ success: false, message: 'content must not exceed 5000 characters' });
      }

      const sanitizedContent = escapeHtml(trimmedContent);

      const parsedChatId = parseInt(chatId, 10);
      if (isNaN(parsedChatId) || parsedChatId < 1) {
        return reply.code(400).send({ success: false, message: 'Invalid chatId' });
      }

      const { message, receiverUserId, isSenderBlocked } = await chatModel.createMessage(
        senderId,
        parsedChatId,
        sanitizedContent
      );

      return reply.code(201).send({ success: true, message, receiverUserId, isSenderBlocked });
    } catch (error) {
      if (error instanceof CustomError.UnauthorizedError) {
        return reply.code(403).send({ success: false, message: error.message });
      }

      request.log && request.log.error(error);
      return reply.code(500).send({ success: false, message: 'Failed to send message' });
    }
  },

  getMessages: async (request, reply) => {
    try {
      if (!request.user || !request.user.id) {
        return reply.status(401).send({ success: false, message: 'User authentication required' });
      }

      const userId = request.user.id;
      const { chatId } = request.params;

      if (!chatId) {
        return reply.code(400).send({ success: false, message: 'chatId is required' });
      }

      const messages = await chatModel.getMessages(userId, parseInt(chatId, 10));
      
      // Mark messages as read when user views the chat
      await chatModel.markMessagesAsRead(userId, parseInt(chatId, 10));

      return reply.send({ success: true, messages: messages });
    } catch (error) {
      if (error instanceof CustomError.UnauthorizedError) {
        return reply.code(403).send({ success: false, message: error.message });
      }

      request.log && request.log.error(error);
      return reply.code(500).send({ success: false, message: 'Failed to fetch messages' });
    }
  },

  markMessagesAsRead: async (request, reply) => {
    try {
      if (!request.user || !request.user.id) {
        return reply.status(401).send({ success: false, message: 'User authentication required' });
      }

      const userId = request.user.id;
      const { chatId } = request.params;

      if (!chatId) {
        return reply.code(400).send({ success: false, message: 'chatId is required' });
      }

      await chatModel.markMessagesAsRead(userId, parseInt(chatId, 10));

      return reply.send({ success: true, message: 'Messages marked as read' });
    } catch (error) {
      if (error instanceof CustomError.UnauthorizedError) {
        return reply.code(403).send({ success: false, message: error.message });
      }

      request.log && request.log.error(error);
      return reply.code(500).send({ success: false, message: 'Failed to mark messages as read' });
    }
  }
});
