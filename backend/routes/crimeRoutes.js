/**
 * Crime Activity Routes - REST API endpoints
 */

const crimeService = require('../services/crimeService');

async function crimeRoutes(fastify, options) {
  // Get available crimes
  fastify.get('/crimes', async (request, reply) => {
    try {
      const userId = request.user.id;

      const character = await fastify.knex('characters')
        .where('user_id', userId)
        .first();

      if (!character) {
        return reply.code(404).send({ success: false, message: 'Character not found' });
      }

      const crimes = await crimeService.getAvailableCrimes(character.level);
      return { success: true, crimes };
    } catch (error) {
      return reply.code(500).send({ success: false, message: error.message });
    }
  });

  // Start crime
  fastify.post('/crimes/:id/start', async (request, reply) => {
    try {
      const userId = request.user.id;
      const crimeId = request.params.id;

      const character = await fastify.knex('characters')
        .where('user_id', userId)
        .first();

      if (!character) {
        return reply.code(404).send({ success: false, message: 'Character not found' });
      }

      const result = await crimeService.startCrime(character.id, crimeId);
      return result;
    } catch (error) {
      return reply.code(400).send({ success: false, message: error.message });
    }
  });

  // Get crime history
  fastify.get('/crimes/history', async (request, reply) => {
    try {
      const userId = request.user.id;
      const limit = request.query.limit || 20;

      const character = await fastify.knex('characters')
        .where('user_id', userId)
        .first();

      if (!character) {
        return reply.code(404).send({ success: false, message: 'Character not found' });
      }

      const history = await crimeService.getCrimeHistory(character.id, limit);
      return { success: true, history };
    } catch (error) {
      return reply.code(500).send({ success: false, message: error.message });
    }
  });

  // Get character resources (energy)
  fastify.get('/resources', async (request, reply) => {
    try {
      const userId = request.user.id;

      const character = await fastify.knex('characters')
        .where('user_id', userId)
        .first();

      if (!character) {
        return reply.code(404).send({ success: false, message: 'Character not found' });
      }

      const resources = await crimeService.getResources(character.id);
      return { success: true, resources };
    } catch (error) {
      return reply.code(500).send({ success: false, message: error.message });
    }
  });

  // Get top criminals leaderboard
  fastify.get('/leaderboard/criminals', async (request, reply) => {
    try {
      const limit = request.query.limit || 10;
      const topCriminals = await crimeService.getTopCriminals(limit);
      return { success: true, topCriminals };
    } catch (error) {
      return reply.code(500).send({ success: false, message: error.message });
    }
  });
}

module.exports = crimeRoutes;
