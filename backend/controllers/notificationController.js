const CustomError = require('../errors');

module.exports = (notificationModel) => ({
	markNonMessageNotificationAsRead: async (request, reply) => {
		try {
			if (!request.user || !request.user.id) {
				return reply.status(401).send({
					success: false,
					message: "User authentication required"
				});
			}

			const { notificationId } = request.params;
			const userId = request.user.id;

			if (!notificationId) {
				return reply.status(400).send({
					success: false,
					message: "Notification ID is required"
				});
			}

			const parsedNotificationId = parseInt(notificationId);
			if (isNaN(parsedNotificationId) || parsedNotificationId <= 0) {
				return reply.status(400).send({
					success: false,
					message: "Notification ID must be a valid positive integer"
				});
			}

			const updated = await notificationModel.markNonMessageNotificationAsRead(
				parsedNotificationId,
				userId
			);

			if (updated === 0) {
				return reply.status(200).send({ 
					success: true,
					message: "Notification not found or already marked as read"
				});
			}
			
			reply.send({ 
				success: true,
				message: "Notification marked as read"
			});
		} catch (error) {
			console.error('Error in markNonMessageNotificationAsRead:', error);
			
			if (error.statusCode === 404) {
				return reply.status(200).send({
					success: true,
					message: "Notification not found or already processed"
				});
			}
			
			const statusCode = error.statusCode || 500;
			reply.status(statusCode).send({
				success: false,
				message: "Failed to mark notification as read",
				error: error.message
			});
		}
	},

	indirectMarkMessageNotificiationAsRead: async (request, reply) => {
		try {
			if (!request.user || !request.user.id) {
				return reply.status(401).send({
					success: false,
					message: "User authentication required"
				});
			}

			const userId = request.user.id;
			const { chatId } = request.params;

			if (!chatId) {
				return reply.status(400).send({
					success: false,
					message: "Chat ID is required"
				});
			}

			const parsedChatId = parseInt(chatId);
			if (isNaN(parsedChatId) || parsedChatId <= 0) {
				return reply.status(400).send({
					success: false,
					message: "Chat ID must be a valid positive integer"
				});
			}

			const updated = await notificationModel.indirectMarkMessageNotificiationAsRead(
				parsedChatId, 
				userId
			);

			if (updated === 0) {
				return reply.status(200).send({ 
					success: true,
					message: "No unread message notifications found for this chat"
				});
			}
			
			reply.send({ 
				success: true,
				message: "Message notification marked as read"
			});
		} catch (error) {
			console.error('Error in indirectMarkMessageNotificiationAsRead:', error);
			
			if (error.statusCode === 404) {
				return reply.status(200).send({
					success: true,
					message: "No unread message notifications found for this chat"
				});
			}
			
			const statusCode = error.statusCode || 500;
			reply.status(statusCode).send({
				success: false,
				message: "Failed to mark message notification as read",
				error: error.message
			});
		}
	},

	markMessageNotificationAsRead: async (request, reply) => {
		try {
			if (!request.user || !request.user.id) {
				return reply.status(401).send({
					success: false,
					message: "User authentication required"
				});
			}

			const { notificationId } = request.params;
			const userId = request.user.id;

			if (!notificationId) {
				return reply.status(400).send({
					success: false,
					message: "Notification ID is required"
				});
			}

			const parsedNotificationId = parseInt(notificationId);
			if (isNaN(parsedNotificationId) || parsedNotificationId <= 0) {
				return reply.status(400).send({
					success: false,
					message: "Notification ID must be a valid positive integer"
				});
			}

			const updated = await notificationModel.markMessageNotificationAsRead(
				parsedNotificationId,
				userId
			);

			if (updated === 0) {
				return reply.status(200).send({ 
					success: true,
					message: "Notification not found or already marked as read"
				});
			}
			
			reply.send({ 
				success: true,
				message: "Notification marked as read"
			});
		} catch (error) {
			console.error('Error in markMessageNotificationAsRead:', error);
			
			if (error.statusCode === 404) {
				return reply.status(200).send({
					success: true,
					message: "Notification not found or already processed"
				});
			}
			
			const statusCode = error.statusCode || 500;
			reply.status(statusCode).send({
				success: false,
				message: "Failed to mark notification as read",
				error: error.message
			});
		}
	},

	markAllNonMessageNotificationsAsOpened: async (request, reply) => {
		try {
			if (!request.user || !request.user.id) {
				return reply.status(401).send({
					success: false,
					message: "User authentication required"
				});
			}

			const userId = request.user.id;

			const updated = await notificationModel.markAllNonMessageNotificationsAsOpened(userId);
			
			reply.send({ 
				success: true,
				message: "All notifications marked as opened",
				count: updated
			});
		} catch (error) {
			console.error('Error in markAllNonMessageNotificationsAsOpened:', error);
			reply.status(500).send({
				success: false,
				message: "Failed to mark notifications as opened",
				error: error.message
			});
		}
	},

	listOtherNotifications: async (request, reply) => {
		try {
			if (!request.user || !request.user.id) {
				return reply.status(401).send({
					success: false,
					message: "User authentication required"
				});
			}

			const { page = 1, limit = 20 } = request.query;
			const userId = request.user.id;
			
			const notifications = await notificationModel.listOtherNotifications(
				parseInt(page),
				parseInt(limit),
				userId
			);

			reply.send({
				success: true,
				data: notifications,
				pagination: {
					page: parseInt(page),
					limit: parseInt(limit),
					total: notifications.length
				}
			});
		} catch (error) {
			console.error('Error in listOtherNotifications:', error);
			reply.status(500).send({
				success: false,
				message: "Failed to fetch notifications",
				error: error.message
			});
		}
	},

	listMessageNotifications: async (request, reply) => {
		try {
			if (!request.user || !request.user.id) {
				return reply.status(401).send({
					success: false,
					message: "User authentication required"
				});
			}

			const { page = 1, limit = 20 } = request.query;
			const userId = request.user.id;
			
			const notifications = await notificationModel.listMessageNotifications(
				parseInt(page),
				parseInt(limit),
				userId
			);

			reply.send({
				success: true,
				data: notifications,
				pagination: {
					page: parseInt(page),
					limit: parseInt(limit),
					total: notifications.length
				}
			});
		} catch (error) {
			console.error('Error in listMessageNotifications:', error);
			reply.status(500).send({
				success: false,
				message: "Failed to fetch message notifications",
				error: error.message
			});
		}
	},
});