const CustomError = require("../errors");
class Friend {
	constructor(db) {
		this.db = db;
	}

	/*
		==================== Purpose ====================
					Check block status between users
		==================================================
	*/
	async getBlockStatus(user1Id, user2Id) {
		const blocks = await this.db("blocks")
			.where(function () {
				this.where({
					blocker_id: user1Id,
					blocked_id: user2Id,
				}).orWhere({ blocker_id: user2Id, blocked_id: user1Id });
			})
			.select("blocker_id", "blocked_id");

		return {
			user1BlockedUser2: blocks.some(
				(block) =>
					Number(block.blocker_id) === Number(user1Id) && Number(block.blocked_id) === Number(user2Id)
			),
			user2BlockedUser1: blocks.some(
				(block) =>
					Number(block.blocker_id) === Number(user2Id) && Number(block.blocked_id) === Number(user1Id)
			),
			isMutualBlock: blocks.length === 2,
		};
	}

	/*
		==================== Purpose ====================
						Send a friend request
		==================================================
	*/
	async sendRequest(senderId, receiverId) {
		let notify = true;
		// Validation
		const user = await this.db("users").where({ id: receiverId }).first();
		if (!user) {
			throw new CustomError.NotFoundError(
				"Invalid reciever id, unable to send request"
			);
		}

		if (Number(senderId) === Number(receiverId)) {
			throw new CustomError.BadRequestError(
				"Cannot send friend request to yourself"
			);
		}

		// If the sender has blocked the receiver, always send this error (regardless of whether they were already friends pre-block or not)
		const blockStatus = await this.getBlockStatus(senderId, receiverId);
		if (blockStatus.user1BlockedUser2) {
			throw new CustomError.UnauthorizedError(
				"Please unblock the user before attempting to send a friend request"
			);
		}
		// If the receiver has blocked the sender, do not notify the receiver about the request but still make the sender believe that the request was sent
		if (blockStatus.user2BlockedUser1) {
			notify = false;
		}

		const friendshipExists = await this.db("friendships")
			.where(function () {
				// Note 1
				this.where({
					user_id: senderId,
					friend_id: receiverId,
				})
					.whereIn("status", ["accepted", "pending"])
					.orWhere({
						user_id: receiverId,
						friend_id: senderId,
					})
					.whereIn("status", ["accepted", "pending"]);
			})
			.first();
		if (friendshipExists) {
			if (friendshipExists.status === "accepted") {
				throw new CustomError.BadRequestError(
					"You are already friends with this user"
				);
			} else if (friendshipExists.status === "pending") {
				if (Number(friendshipExists.user_id) === Number(senderId)) {
					throw new CustomError.BadRequestError(
						"Friend request has already been sent"
					);
				} else {
					throw new CustomError.BadRequestError(
						"Already recieved a pending request from this user"
					);
				}
			}
		}

		// Create friendship if validation succeeds
		await this.db("friendships").insert({
			user_id: senderId,
			friend_id: receiverId,
		});

		return notify;
	}

	/*
		==================== Purpose ====================
					Accept or reject a request
		==================================================
	*/
	async handleRequest(friendshipId, receiverId, action) {
		const friendship = await this.db("friendships")
			.where({ id: friendshipId })
			.first();

		// Validation
		if (!friendship) {
			throw new CustomError.NotFoundError("No such request was found");
		}
		// if (Number(friendship.friend_id) !== Number(receiverId)) {
		// 	throw new CustomError.UnauthorizedError(
		// 		"You're not authorized to respond to this request"
		// 	);
		// }
		if (friendship.status === "accepted") {
			throw new CustomError.BadRequestError(
				"You are already friends with this user"
			);
		}
		if (friendship.status === "cancelled") {
			throw new CustomError.BadRequestError(
				"This friend request is no longer available"
			);
		}

		// Update the friendship status
		const status = action === "accept" ? "accepted" : "declined";
		await this.db("friendships").where({ id: friendship.id }).update({
			status,
			updated_at: this.db.fn.now(),
		});

		// Get the sender's username
		const { username } = await this.db("users")
			.where({ id: friendship.user_id })
			.select("username")
			.first();

		// Store sender details in an object
		const senderUser = {
			id: friendship.user_id,
			username,
		};

		return {
			senderUser,
			status,
		};
	}

	/*
		==================== Purpose ====================
				* Cancel a pending request that you sent
				* Delete a friendship
		==================================================
	*/
	async abortFriendship(friendshipId, userId) {
		const friendship = await this.db("friendships")
			.where({ id: friendshipId })
			.first();

		// Validation
		if (!friendship) {
			throw new CustomError.NotFoundError("No such request was found");
		}
		if (Number(friendship.user_id) !== Number(userId) && Number(friendship.friend_id) !== Number(userId)) {
			throw new CustomError.UnauthorizedError(
				"You're not authorized to respond to this request"
			);
		}
		let exFriendIdCapture = null;
		let newStatus = null;
		// Validation: If status is pending, only sender can cancel the request (to unfriend an existing friend, use handleRequest instead)
		if (friendship.status === "pending") {
			if (Number(friendship.user_id) !== Number(userId)) {
				throw new CustomError.UnauthorizedError(
					"You're not authorized to perform this action!"
				);
			}
			exFriendIdCapture = friendship.friend_id;
			newStatus = "cancelled";
		}
		// Validation: Prevent any user from deleting a declined request
		else if (friendship.status === "declined") {
			throw new CustomError.BadRequestError(
				"This friend request has already been declined and cannot be modified!"
			);
		}
		else if (friendship.status === "unfriended") {
			throw new CustomError.BadRequestError(
				"Cannot unfriend a user you are no longer friends with"
			);
		}
		// Validation: obtain the ex-friend's user id
		else {
			exFriendIdCapture =
				Number(userId) === Number(friendship.user_id)
					? friendship.friend_id
					: friendship.user_id;
			newStatus = "unfriended";
		}

		// Delete the pending request or unfriend the user
		await this.db("friendships")
			.where({ id: friendshipId })
			.update({ status: newStatus });

		return exFriendIdCapture;
	}

	/*
		==================== Purpose ====================
						List all your friends
		==================================================
	*/
	async listFriends(userId) {
		// Get base friends list without block filtering
		const baseQuery = this.db("friendships").where("status", "accepted");

		// Query when user is the sender of friend request
		const q1 = baseQuery
			.clone()
			.where("friendships.user_id", userId)
			// Note 4
			.leftJoin("blocks as b", function () {
				this.on("b.blocker_id", "=", userId) // blocker is the current user
					.andOn("b.blocked_id", "=", "friendships.friend_id"); // blocked person is the friend (we need this because we are only concerned with blocked FRIENDS of the user, not just anyone who the user has blocked)
			})
			.join("users", "friendships.friend_id", "users.id")
			.whereNull("b.id") // only include rows were the block id is null, meaning the user has not blocked the friend
			.select(
				"users.id as userId",
				"users.username",
				"friendships.id as friendshipId"
			);

		// Query when user is the receiver of friend request
		const q2 = baseQuery
			.clone()
			.where("friendships.friend_id", userId)
			// Note 4
			.leftJoin("blocks as b", function () {
				this.on("b.blocker_id", "=", userId) // blocker is the current user
					.andOn("b.blocked_id", "=", "friendships.user_id"); // blocked person is the friend (we need this because we are only concerned with blocked FRIENDS of the user, not just anyone who the user has blocked)
			})
			.join("users", "friendships.user_id", "users.id")
			.whereNull("b.id") // only include rows were the block id is null, meaning the user has not blocked the friend
			.select(
				"users.id as userId",
				"users.username",
				"friendships.id as friendshipId"
			);

		const allFriends = await q1.union(q2);
		
		// Add unread message count and default status field for frontend
		const friendsWithUnread = await Promise.all(allFriends.map(async (friend) => {
			// Get unread count for this friend
			let unreadCount = 0;
			try {
				// Try to find a chat with this friend
				const chatRow = await this.db("chat_participants as cp1")
					.join("chat_participants as cp2", "cp1.chat_id", "cp2.chat_id")
					.where("cp1.user_id", userId)
					.andWhere("cp2.user_id", friend.userId)
					.first();
				
				if (chatRow) {
					// Count unread messages from this friend
					const unreadResult = await this.db("messages")
						.where({
							chat_id: chatRow.chat_id,
							sender_id: friend.userId,
							is_read: false,
							blocks_active: false
						})
						.count("* as count")
						.first();
					
					unreadCount = unreadResult ? unreadResult.count : 0;
				}
			} catch (err) {
				// If there's an error getting unread count, just set it to 0
				console.error(`Error getting unread count for friend ${friend.userId}:`, err);
			}
			
			return {
				...friend,
				unread_count: unreadCount,
				status: 'offline' // Online status tracking not implemented
			};
		}));

		return friendsWithUnread;
	}

	/*
		==================== Purpose ====================
				* List pending outgoing requests (direction: sent)
				* List pending incoming requests (direction: received)
		==================================================
	*/
	async listRequests(userId, status, direction) {
		// First get all requests without block filtering
		const baseQuery = this.db("friendships").where("status", status); // status is always 'pending' at this endpoint
		let requests;

		if (direction === "sent") {
			requests = await baseQuery
				.clone()
				.where("friendships.user_id", userId)
				.join("users", "friendships.friend_id", "users.id")
				.select(
					"friendships.id as friendshipId",
					"users.id as recipientId",
					"users.username as senderUsername"
				);
		} else {
			requests = await baseQuery
				.clone()
				.where("friendships.friend_id", userId)
				// Note 5
				.leftJoin("blocks as b", function () {
					this.on("b.blocker_id", "=", userId) // blocker is the current user
						.andOn("b.blocked_id", "=", "friendships.user_id"); // blocked person is the sender (we need this because we are only concerned with blocked SENDERS of the user, not just anyone who the user has blocked)
				})
				.join("users", "friendships.user_id", "users.id")
				.whereNull("b.id") // only include rows were the block id is null, meaning the user has not blocked the sender
				.select(
					"friendships.id as friendshipId",
					"users.id as senderId",
					"users.username as senderUsername"
				);
		}

		return requests;
	}

	/*
		==================== Purpose ====================
			* Helper for the blockService
			* Find friendship between two users
		==================================================
	*/
	async findFriendshipBetweenUsers(user1Id, user2Id) {
		return await this.db("friendships")
			.where(function () {
				this.where({
					user_id: user1Id,
					friend_id: user2Id,
				}).orWhere({
					user_id: user2Id,
					friend_id: user1Id,
				});
			})
			.whereIn("status", ["accepted", "pending"])
			.first();
	}

	/*
		==================== Purpose ====================
			* Helper for the blockService
			* Update friendship status
		==================================================
	*/
	async updateFriendshipStatus(friendshipId, newStatus) {
		await this.db("friendships").where({ id: friendshipId }).update({
			status: newStatus,
			updated_at: this.db.fn.now(),
		});
	}

	/*
		==================== Purpose ====================
					Block a friend
		- Creates a block record
		- Removes the friendship
		- Prevents future communication
		==================================================
	*/
	async blockFriend(userId, friendToBlockId) {
		// Validation
		const friend = await this.db("users").where({ id: friendToBlockId }).first();
		if (!friend) {
			throw new CustomError.NotFoundError(
				"Invalid friend id, unable to block"
			);
		}

		if (Number(userId) === Number(friendToBlockId)) {
			throw new CustomError.BadRequestError(
				"Cannot block yourself"
			);
		}

		// Check if already blocked
		const existingBlock = await this.db("blocks")
			.where({
				blocker_id: userId,
				blocked_id: friendToBlockId,
			})
			.first();

		if (existingBlock) {
			throw new CustomError.BadRequestError(
				"You have already blocked this user"
			);
		}

		// Create the block record
		await this.db("blocks").insert({
			blocker_id: userId,
			blocked_id: friendToBlockId,
			is_active: true,
		});

		// Remove the friendship if it exists
		const friendship = await this.findFriendshipBetweenUsers(userId, friendToBlockId);
		if (friendship) {
			await this.db("friendships").where({ id: friendship.id }).update({
				status: "unfriended",
				updated_at: this.db.fn.now(),
			});
		}

		return friendToBlockId;
	}

	/*
		==================== Purpose ====================
				Unblock a user (remove from blocks)
		==================================================
	*/
	async unblockFriend(userId, friendToUnblockId) {
		// Validation
		const friend = await this.db("users").where({ id: friendToUnblockId }).first();
		if (!friend) {
			throw new CustomError.NotFoundError(
				"Invalid friend id, unable to unblock"
			);
		}

		if (Number(userId) === Number(friendToUnblockId)) {
			throw new CustomError.BadRequestError(
				"Cannot unblock yourself"
			);
		}

		// Check if the user is blocked
		const existingBlock = await this.db("blocks")
			.where({
				blocker_id: userId,
				blocked_id: friendToUnblockId,
			})
			.first();

		if (!existingBlock) {
			throw new CustomError.BadRequestError(
				"This user is not blocked"
			);
		}

		// Remove the block record
		await this.db("blocks")
			.where({
				blocker_id: userId,
				blocked_id: friendToUnblockId,
			})
			.delete();

		return friendToUnblockId;
	}

	/*
		==================== Purpose ====================
				List all blocked users for a given user
		==================================================
	*/
	async listBlockedUsers(userId) {
		const blockedUsers = await this.db("blocks")
			.where({ blocker_id: userId, is_active: true })
			.join("users", "blocks.blocked_id", "users.id")
			.select(
				"users.id as userId",
				"users.username",
				"blocks.id as blockId"
			);

		return blockedUsers;
	}
}

module.exports = Friend;

