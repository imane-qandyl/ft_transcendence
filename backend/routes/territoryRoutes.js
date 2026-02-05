/**
 * Territory Routes - REST API endpoints
 */

const territoryService = require('../services/territoryService');

async function territoryRoutes(fastify, options) {
  // Get all territories
  fastify.get('/territories', async (request, reply) => {
    try {
      const territories = await territoryService.getAllTerritories();
      return { success: true, territories };
    } catch (error) {
      return reply.code(500).send({ success: false, message: error.message });
    }
  });

  // Get my territories
  fastify.get('/territories/mine', async (request, reply) => {
    try {
      const userId = request.user.id;
      const character = await fastify.knex('characters')
        .where('user_id', userId)
        .first();

      if (!character) {
        return reply.code(404).send({ success: false, message: 'Character not found' });
      }

      const territories = await territoryService.getCharacterTerritories(character.id);
      return { success: true, territories };
    } catch (error) {
      return reply.code(500).send({ success: false, message: error.message });
    }
  });

  // Attack territory
  fastify.post('/territories/:id/attack', async (request, reply) => {
    try {
      const userId = request.user.id;
      const territoryId = request.params.id;

      const character = await fastify.knex('characters')
        .where('user_id', userId)
        .first();

      if (!character) {
        return reply.code(404).send({ success: false, message: 'Character not found' });
      }

      const result = await territoryService.attackTerritory(territoryId, character.id);
      return result;
    } catch (error) {
      return reply.code(400).send({ success: false, message: error.message });
    }
  });

  // Collect income
  fastify.post('/territories/collect-income', async (request, reply) => {
    try {
      const userId = request.user.id;

      const character = await fastify.knex('characters')
        .where('user_id', userId)
        .first();

      if (!character) {
        return reply.code(404).send({ success: false, message: 'Character not found' });
      }

      const result = await territoryService.collectIncome(character.id);
      return { success: true, ...result };
    } catch (error) {
      return reply.code(500).send({ success: false, message: error.message });
    }
  });

  // Get territory battle history
  fastify.get('/territories/:id/history', async (request, reply) => {
    try {
      const territoryId = request.params.id;
      const limit = request.query.limit || 10;

      const history = await territoryService.getTerritoryHistory(territoryId, limit);
      return { success: true, history };
    } catch (error) {
      return reply.code(500).send({ success: false, message: error.message });
    }
  });
}

module.exports = territoryRoutes;
