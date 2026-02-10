const createMatchSchema = {
    body: {
        type: 'object',
        required: ['player2_id'],
        properties: {
            player2_id: { type: 'integer' },
            game_type: { 
                type: 'string',
                enum: ['classic', 'ranked'],
                default: 'classic'
            }
        }
    }
};

const updateMatchSchema = {
    params: {
        type: 'object',
        required: ['id'],
        properties: {
            id: { type: 'integer' }
        }
    },
    body: {
        type: 'object',
        properties: {
            player1_score: { type: 'integer', minimum: 0 },
            player2_score: { type: 'integer', minimum: 0 },
            status: { 
                type: 'string',
                enum: ['pending', 'in_progress', 'completed', 'cancelled']
            },
            winner_id: { type: 'integer' },
            ended_at: { type: 'string', format: 'date-time' }
        }
    }
};

const getMatchSchema = {
    params: {
        type: 'object',
        required: ['id'],
        properties: {
            id: { type: 'integer' }
        }
    }
};

const getMatchesSchema = {
    querystring: {
        type: 'object',
        properties: {
            user_id: { type: 'integer' },
            status: { 
                type: 'string',
                enum: ['pending', 'in_progress', 'completed', 'cancelled']
            },
            limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
            offset: { type: 'integer', minimum: 0, default: 0 }
        }
    }
};

module.exports = {
    createMatchSchema,
    updateMatchSchema,
    getMatchSchema,
    getMatchesSchema
};
