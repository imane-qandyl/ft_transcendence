const registerSchema = {
	body: {
		type: 'object',
		required: ['username', 'email', 'password'],
		properties: {
			username: {
				type: 'string',
				minLength: 3,
				maxLength: 30,
				description: 'Username must be 3-30 characters'
			},
			email: {
				type: 'string',
				format: 'email',
				description: 'Valid email address'
			},
			password: {
				type: 'string',
				minLength: 8,
				maxLength: 128,
				description: 'Password must be at least 8 characters'
			}
		}
	}
};

const loginSchema = {
	body: {
		type: 'object',
		required: ['email', 'password'],
		properties: {
			email: {
				type: 'string',
				format: 'email',
				description: 'User email'
			},
			password: {
				type: 'string',
				minLength: 1,
				description: 'User password'
			}
		}
	}
};

const loginJwtSchema = {
	body: {
		type: 'object',
		required: ['email', 'password'],
		properties: {
			email: {
				type: 'string',
				format: 'email',
				description: 'User email'
			},
			password: {
				type: 'string',
				minLength: 1,
				description: 'User password'
			},
			deviceId: {
				type: 'string',
				description: 'Optional device identifier for token management'
			}
		}
	}
};

const googleAuthSchema = {
	body: {
		type: 'object',
		required: ['token'],
		properties: {
			token: {
				type: 'string',
				description: 'Google OAuth token'
			}
		}
	}
};

const refreshTokenSchema = {
	body: {
		type: 'object',
		required: ['refreshToken'],
		properties: {
			refreshToken: {
				type: 'string',
				description: 'Refresh token from previous login'
			}
		}
	}
};

const logoutSchema = {
	body: {
		type: 'object',
		properties: {
			deviceId: {
				type: 'string',
				description: 'Optional device ID to logout specific device'
			}
		}
	}
};

const enable2FASchema = {
	body: {
		type: 'object',
		properties: {}
	}
};

const verify2FASchema = {
	body: {
		type: 'object',
		required: ['code'],
		properties: {
			code: {
				type: 'string',
				pattern: '^[0-9]{6}$',
				description: '6-digit 2FA code'
			}
		}
	}
};

const disable2FASchema = {
	body: {
		type: 'object',
		required: ['password'],
		properties: {
			password: {
				type: 'string',
				minLength: 1,
				description: 'User password for security verification'
			}
		}
	}
};

module.exports = {
	registerSchema,
	loginSchema,
	loginJwtSchema,
	googleAuthSchema,
	refreshTokenSchema,
	logoutSchema,
	enable2FASchema,
	verify2FASchema,
	disable2FASchema
};
