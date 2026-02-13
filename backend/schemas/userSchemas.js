const updateProfileSchema = {
	body: {
		type: 'object',
		properties: {
			username: {
				type: 'string',
				minLength: 3,
				maxLength: 30,
				description: 'Username must be 3-30 characters'
			},
			avatar_url: {
				type: 'string',
				format: 'uri',
				description: 'User avatar URL'
			},
			bio: {
				type: 'string',
				maxLength: 500,
				description: 'User bio/description'
			}
		}
	}
};

const updatePasswordSchema = {
	body: {
		type: 'object',
		required: ['currentPassword', 'newPassword'],
		properties: {
			currentPassword: {
				type: 'string',
				minLength: 1,
				description: 'Current password for verification'
			},
			newPassword: {
				type: 'string',
				minLength: 8,
				maxLength: 128,
				description: 'New password (must be at least 8 characters)'
			}
		}
	}
};

const getUserByIdSchema = {
	params: {
		type: 'object',
		required: ['userId'],
		properties: {
			userId: {
				type: 'integer',
				minimum: 1,
				description: 'User ID'
			}
		}
	}
};

const searchUsersSchema = {
	querystring: {
		type: 'object',
		properties: {
			query: {
				type: 'string',
				minLength: 1,
				maxLength: 50,
				description: 'Search query for username'
			},
			limit: {
				type: 'integer',
				minimum: 1,
				maximum: 50,
				default: 10,
				description: 'Number of results to return'
			}
		}
	}
};

module.exports = {
	updateProfileSchema,
	updatePasswordSchema,
	getUserByIdSchema,
	searchUsersSchema
};
