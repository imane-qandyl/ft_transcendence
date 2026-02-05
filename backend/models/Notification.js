const CustomError = require("../errors");

class Notification {
	constructor(db) {
		this.db = db;
	}

	async createNotification(
		senderId,
		receiverId,
		chatId,
		type,
		message,
		systemWide = false
	) {
		// Validation
		if (!systemWide && !senderId) {
			throw new CustomError.BadRequestError(
				"Missing senderId for non-system notification"
			);
		}
		if (!receiverId || !type || !message) {
			throw new CustomError.BadRequestError(
				"Missing required notification data: receiverId, type, or message"
			);
		}

		if (type === "message") {
			// Use transaction to prevent race conditions
			return await this.db.transaction(async (trx) => {
				const existingMessage = await trx("notifications")
					.where({
						sender_id: senderId,
						receiver_id: receiverId,
						chat_id: chatId,
						type,
					})
					.orderBy("updated_at", "desc")
					.first()
					.forUpdate(); // Lock the row

				if (existingMessage) {
					const senderUsername = existingMessage.message.split(" ")[0];

					if (!existingMessage.is_read) {
						const newCount = (existingMessage.message_count || 1) + 1;
						await trx("notifications")
							.where({ id: existingMessage.id })
							.update({
								message: `${senderUsername} has sent you ${newCount} messages!`,
								message_count: newCount,
								is_opened: false,
								updated_at: trx.raw("CURRENT_TIMESTAMP"),
							});
					} else {
						await trx("notifications")
							.where({ id: existingMessage.id })
							.update({
								message: `${senderUsername} has sent you a message!`,
								message_count: 1,
								is_read: false,
								is_opened: false,
								updated_at: trx.raw("CURRENT_TIMESTAMP"),
							});
					}
					return;
				}

				// Create new notification
				await trx("notifications").insert({
					sender_id: senderId,
					receiver_id: receiverId,
					chat_id: chatId,
					type,
					message,
					message_count: 1,
				});
			});
		}

		// Non-message notifications
		await this.db("notifications").insert({
			sender_id: senderId,
			receiver_id: receiverId,
			chat_id: null,
			type,
			message,
		});
	}

	async deleteNotification(senderId, receiverId, type) {
		if (!senderId || !receiverId || !type) {
			throw new CustomError.BadRequestError(
				"Missing required notification data for deletion"
			);
		}
		
		const deleted = await this.db("notifications")
			.where({
				sender_id: senderId,
				receiver_id: receiverId,
				type,
			})
			.del();
			
		return deleted;
	}

	async deleteAllBilateralNotifications(friend1Id, friend2Id, type) {
		if (!friend1Id || !friend2Id || !type) {
			throw new CustomError.BadRequestError(
				"Missing required data for bilateral notification deletion"
			);
		}
		
		const deleted = await this.db("notifications")
			.where(function() {
				this.where({
					sender_id: friend1Id,
					receiver_id: friend2Id,
					type,
				}).orWhere({
					sender_id: friend2Id,
					receiver_id: friend1Id,
					type,
				});
			})
			.del();
			
		return deleted;
	}

	async listOtherNotifications(page = 1, limit = 20, receiverId) {
		if (!receiverId) {
			throw new CustomError.BadRequestError("Missing receiverId");
		}

		const notifications = await this.db("notifications")
			.select([
				'id',
				'sender_id',
				'type',
				'message',
				'is_read',
				'is_opened',
				'created_at',
				'updated_at'
			])
			.where("receiver_id", receiverId)
			.whereNot("type", "message")
			.orderBy("updated_at", "desc")
			.limit(limit)
			.offset((page - 1) * limit);

		return notifications;
	}

	async listMessageNotifications(page = 1, limit = 20, receiverId) {
		if (!receiverId) {
			throw new CustomError.BadRequestError("Missing receiverId");
		}

		const notifications = await this.db("notifications")
			.select([
				'id',
				'sender_id',
				'chat_id',
				'message',
				'message_count',
				'created_at',
				'updated_at'
			])
			.where({ 
				receiver_id: receiverId, 
				type: "message", 
				is_read: false 
			})
			.orderBy("updated_at", "desc")
			.limit(limit)
			.offset((page - 1) * limit);

		return notifications;
	}

	async indirectMarkMessageNotificiationAsRead(chatId, userId) {
		if (!chatId || !userId) {
			throw new CustomError.BadRequestError("Missing chatId or userId");
		}

		const notification = await this.db("notifications")
			.where({ 
				chat_id: chatId, 
				receiver_id: userId, 
				type: "message",
				is_read: false 
			})
			.first();
			
		if (!notification) {
			return 0; // Return 0 instead of throwing error
		}

		const updated = await this.db("notifications")
			.where("id", notification.id)
			.update({ 
				is_read: true, 
				is_opened: true,
				updated_at: this.db.raw("CURRENT_TIMESTAMP")
			});
			
		return updated;
	}

	async markMessageNotificationAsRead(notificationId, userId) {
		if (!notificationId || !userId) {
			throw new CustomError.BadRequestError("Missing notificationId or userId");
		}

		const notification = await this.db("notifications")
			.where({ 
				id: notificationId,
				receiver_id: userId, 
				type: "message"
			})
			.first();
			
		if (!notification) {
			return 0; // Return 0 instead of throwing error
		}

		const updated = await this.db("notifications")
			.where("id", notificationId)
			.update({ 
				is_read: true, 
				is_opened: true,
				updated_at: this.db.raw("CURRENT_TIMESTAMP")
			});
			
		return updated;
	}

	async markNonMessageNotificationAsRead(notificationId, userId) {
		if (!notificationId || !userId) {
			throw new CustomError.BadRequestError("Missing notificationId or userId");
		}

		const notification = await this.db("notifications")
			.where("id", notificationId)
			.whereNot("type", "message")
			.first();
			
		if (!notification) {
			return 0; // Return 0 instead of throwing error
		}
		
		if (notification.receiver_id !== userId) {
			throw new CustomError.ForbiddenError(
				"You're not authorized to update this notification"
			);
		}
		
		const updated = await this.db("notifications")
			.where("id", notificationId)
			.update({ 
				is_read: true,
				updated_at: this.db.raw("CURRENT_TIMESTAMP")
			});
			
		return updated;
	}

	async markAllNonMessageNotificationsAsOpened(userId) {
		if (!userId) {
			throw new CustomError.BadRequestError("Missing userId");
		}

		const updated = await this.db("notifications")
			.where({ 
				is_opened: false, 
				receiver_id: userId 
			})
			.whereNot("type", "message")
			.update({ 
				is_opened: true,
				updated_at: this.db.raw("CURRENT_TIMESTAMP")
			});
			
		return updated;
	}
}

module.exports = Notification;