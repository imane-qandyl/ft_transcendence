const createCharacterSchema = {
	body: {
		type: 'object',
		required: ['name', 'characterClass'],
		properties: {
			name: {
				type: 'string',
				minLength: 1,
				maxLength: 50,
				description: 'Character name'
			},
			characterClass: {
				type: 'string',
				enum: ['pink', 'owlet', 'dude', 'warrior', 'mage', 'rogue'],
				description: 'Character class/type'
			},
			sprite_body: {
				type: 'string',
				description: 'Body sprite identifier'
			},
			sprite_hair: {
				type: 'string',
				description: 'Hair sprite identifier'
			},
			sprite_outfit: {
				type: 'string',
				description: 'Outfit sprite identifier'
			}
		}
	}
};

const selectCharacterSchema = {
	params: {
		type: 'object',
		required: ['characterId'],
		properties: {
			characterId: {
				type: 'integer',
				minimum: 1,
				description: 'Character ID to select as active'
			}
		}
	}
};

const updateCharacterSchema = {
	params: {
		type: 'object',
		required: ['characterId'],
		properties: {
			characterId: {
				type: 'integer',
				minimum: 1,
				description: 'Character ID to update'
			}
		}
	},
	body: {
		type: 'object',
		properties: {
			name: {
				type: 'string',
				minLength: 1,
				maxLength: 50,
				description: 'Character name'
			},
			sprite_body: {
				type: 'string',
				description: 'Body sprite identifier'
			},
			sprite_hair: {
				type: 'string',
				description: 'Hair sprite identifier'
			},
			sprite_outfit: {
				type: 'string',
				description: 'Outfit sprite identifier'
			}
		}
	}
};

const deleteCharacterSchema = {
	params: {
		type: 'object',
		required: ['characterId'],
		properties: {
			characterId: {
				type: 'integer',
				minimum: 1,
				description: 'Character ID to delete'
			}
		}
	}
};

const getCharacterSchema = {
	params: {
		type: 'object',
		required: ['characterId'],
		properties: {
			characterId: {
				type: 'integer',
				minimum: 1,
				description: 'Character ID'
			}
		}
	}
};

module.exports = {
	createCharacterSchema,
	selectCharacterSchema,
	updateCharacterSchema,
	deleteCharacterSchema,
	getCharacterSchema
};
