const { createMatchSchema, updateMatchSchema, getMatchSchema, getMatchesSchema } = require('../schemas/matchSchemas');

async function matchRoutes(fastify, options) {
    const { db } = options;

    // POST /api/v1/matches - Create a new match
    fastify.post('/', {
        schema: createMatchSchema,
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const { player2_id, game_type = 'classic' } = request.body;
            const player1_id = request.user.id;

            // Validate request body
            if (!player2_id) {
                return reply.code(400).send({
                    success: false,
                    message: 'player2_id is required'
                });
            }

            // Validate players are different
            if (player1_id === player2_id) {
                return reply.code(400).send({
                    success: false,
                    message: 'Cannot create match against yourself'
                });
            }

            // Check if player2 exists
            const player2 = await db('users').where('id', player2_id).first();
            if (!player2) {
                return reply.code(404).send({
                    success: false,
                    message: 'Opponent not found'
                });
            }

            const [match] = await db('matches').insert({
                player1_id,
                player2_id,
                match_type: game_type,
                status: 'pending',
                started_at: new Date()
            }).returning('*');

            return reply.code(201).send({
                success: true,
                match_id: match.id,
                match: match,
                message: 'Match created successfully'
            });
        } catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({
                success: false,
                message: 'Error creating match'
            });
        }
    });

    // GET /api/v1/matches - Get user's matches
    fastify.get('/', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const userId = request.user.id;

            const matches = await db('matches')
                .select(
                    'matches.*',
                    'p1.username as player1_username',
                    'p2.username as player2_username'
                )
                .leftJoin('users as p1', 'matches.player1_id', 'p1.id')
                .leftJoin('users as p2', 'matches.player2_id', 'p2.id')
                .where('player1_id', userId)
                .orWhere('player2_id', userId)
                .orderBy('matches.created_at', 'desc');

            return reply.send({
                success: true,
                matches
            });
        } catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({
                success: false,
                message: 'Error fetching matches'
            });
        }
    });

    // PUT /api/v1/matches/:matchId - Update match result
    fastify.put('/:matchId', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const { matchId } = request.params;
            const { winner_id, player1_score, player2_score, status = 'completed' } = request.body;

            await db('matches')
                .where('id', matchId)
                .update({
                    winner_id,
                    player1_score,
                    player2_score,
                    status,
                    updated_at: new Date()
                });

            return reply.send({
                success: true,
                message: 'Match updated successfully'
            });
        } catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({
                success: false,
                message: 'Error updating match'
            });
        }
    });

    //DELETE /api/v1/matches/:matchId - Delete a match
    fastify.delete('/:matchId', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const { matchId } = request.params;

            await db('matches')
                .where('id', matchId)
                .del();

            return reply.send({
                success: true,
                message: 'Match deleted successfully'
            });
        } catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({
                success: false,
                message: 'Error deleting match'
            });
        }
    });
}

module.exports = matchRoutes;
