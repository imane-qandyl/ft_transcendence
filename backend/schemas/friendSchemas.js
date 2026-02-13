const sendFriendRequestSchema = {
	body: {
		type: 'object',
		required: ['targetUserId'],
		properties: {
			targetUserId: {
				type: 'integer',
				minimum: 1,
				description: 'ID of user to send friend request to'
			}
		}
	}
};

const respondToRequestSchema = {
	params: {
		type: 'object',
		required: ['friendshipId'],
		properties: {
			friendshipId: {
				type: 'integer',
				minimum: 1,
				description: 'Friendship request ID'
			}
		}
	},
	body: {
		type: 'object',
		required: ['action'],
		properties: {
			action: {
				type: 'string',
				enum: ['accept', 'decline', 'reject'],
				description: 'Action to perform on the request'
			}
		}
	}
};

const cancelFriendshipSchema = {
	params: {
		type: 'object',
		required: ['friendshipId'],
		properties: {
			friendshipId: {
				type: 'integer',
				minimum: 1,
				description: 'Friendship ID to cancel/unfriend'
			}
		}
	}
};

const blockUserSchema = {
	params: {
		type: 'object',
		required: ['friendId'],
		properties: {
			friendId: {
				type: 'integer',
				minimum: 1,
				description: 'User ID to block'
			}
		}
	}
};

const unblockUserSchema = {
	params: {
		type: 'object',
		required: ['friendId'],
		properties: {
			friendId: {
				type: 'integer',
				minimum: 1,
				description: 'User ID to unblock'
			}
		}
	}
};

const listFriendsSchema = {
	querystring: {
		type: 'object',
		properties: {
			page: {
				type: 'integer',
				minimum: 1,
				default: 1,
				description: 'Page number for pagination'
			},
			limit: {
				type: 'integer',
				minimum: 1,
				maximum: 100,
				default: 20,
				description: 'Number of friends per page'
			}
		}
	}
};

const listRequestsSchema = {
	querystring: {
		type: 'object',
		properties: {
			page: {
				type: 'integer',
				minimum: 1,
				default: 1,
				description: 'Page number for pagination'
			},
			limit: {
				type: 'integer',
				minimum: 1,
				maximum: 100,
				default: 20,
				description: 'Number of requests per page'
			}
		}
	}
};

module.exports = {
	sendFriendRequestSchema,
	respondToRequestSchema,
	cancelFriendshipSchema,
	blockUserSchema,
	unblockUserSchema,
	listFriendsSchema,
	listRequestsSchema
};
