const createChatSchema = {
	body: {
		type: 'object',
		required: ['user2_id'],
		properties: {
			user2_id: {
				type: 'integer',
				minimum: 1,
				description: 'ID of the user to start chat with'
			}
		}
	}
};

const getChatBetweenUsersSchema = {
	params: {
		type: 'object',
		required: ['user2Id'],
		properties: {
			user2Id: {
				type: 'integer',
				minimum: 1,
				description: 'ID of the other user in the chat'
			}
		}
	}
};

const getMessagesSchema = {
	params: {
		type: 'object',
		required: ['chatId'],
		properties: {
			chatId: {
				type: 'integer',
				minimum: 1,
				description: 'ID of the chat'
			}
		}
	},
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
				description: 'Number of messages per page'
			}
		}
	}
};

const createMessageSchema = {
	params: {
		type: 'object',
		required: ['chatId'],
		properties: {
			chatId: {
				type: 'integer',
				minimum: 1,
				description: 'ID of the chat to send message in'
			}
		}
	},
	body: {
		type: 'object',
		required: ['content'],
		properties: {
			content: {
				type: 'string',
				minLength: 1,
				maxLength: 5000,
				description: 'Message content'
			}
		}
	}
};

const markMessagesAsReadSchema = {
	params: {
		type: 'object',
		required: ['chatId'],
		properties: {
			chatId: {
				type: 'integer',
				minimum: 1,
				description: 'ID of the chat'
			}
		}
	}
};

module.exports = {
	createChatSchema,
	getChatBetweenUsersSchema,
	getMessagesSchema,
	createMessageSchema,
	markMessagesAsReadSchema
};
