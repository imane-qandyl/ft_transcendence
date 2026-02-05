/**
 * Shop Routes - REST API endpoints for item purchasing
 */

module.exports = async function(fastify, options) {
  const db = fastify.knex || options.db;

  /**
   * Get all items in shop
   * GET /api/v1/shop/items
   */
  fastify.get('/items', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    const { type, slot, minLevel, maxLevel } = request.query;

    try {
      let query = db('items').select('*');

      // Apply filters
      if (type) {
        query = query.where('type', type);
      }

      if (slot) {
        query = query.where('slot', slot);
      }

      if (minLevel) {
        query = query.where('level_required', '>=', parseInt(minLevel));
      }

      if (maxLevel) {
        query = query.where('level_required', '<=', parseInt(maxLevel));
      }

      const items = await query.orderBy('level_required').orderBy('price');

      return reply.send({
        items
      });

    } catch (error) {
      fastify.log.error('Get shop items error:', error);
      return reply.code(500).send({
        error: 'Failed to get shop items'
      });
    }
  });

  /**
   * Purchase an item
   * POST /api/v1/shop/purchase/:itemId
   */
  fastify.post('/purchase/:itemId', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    const userId = request.user.id;
    const { itemId } = request.params;

    try {
      // Get character
      const character = await db('characters')
        .where('user_id', userId)
        .first();

      if (!character) {
        return reply.code(404).send({
          error: 'No character found. Create a character first.'
        });
      }

      // Get item
      const item = await db('items')
        .where('id', itemId)
        .first();

      if (!item) {
        return reply.code(404).send({
          error: 'Item not found'
        });
      }

      // Check if character has enough coins
      if (character.coins < item.price) {
        return reply.code(400).send({
          error: `Not enough coins. You have ${character.coins}, but this item costs ${item.price}`
        });
      }

      // Check if item already owned
      const existing = await db('character_inventory')
        .where({
          character_id: character.id,
          item_id: itemId
        })
        .first();

      if (existing) {
        return reply.code(400).send({
          error: 'You already own this item'
        });
      }

      // Purchase item (deduct coins and add to inventory)
      await db.transaction(async trx => {
        // Deduct coins
        await trx('characters')
          .where('id', character.id)
          .decrement('coins', item.price);

        // Add to inventory
        await trx('character_inventory').insert({
          character_id: character.id,
          item_id: itemId,
          quantity: 1
        });
      });

      return reply.send({
        message: 'Item purchased successfully',
        item: {
          name: item.name,
          type: item.type,
          price: item.price
        },
        remainingCoins: character.coins - item.price
      });

    } catch (error) {
      fastify.log.error('Purchase item error:', error);
      return reply.code(500).send({
        error: 'Failed to purchase item'
      });
    }
  });

  /**
   * Sell an item
   * DELETE /api/v1/shop/sell/:itemId
   */
  fastify.delete('/sell/:itemId', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    const userId = request.user.id;
    const { itemId } = request.params;

    try {
      const character = await db('characters')
        .where('user_id', userId)
        .first();

      if (!character) {
        return reply.code(404).send({
          error: 'No character found'
        });
      }

      // Check if item in inventory
      const inventoryItem = await db('character_inventory')
        .where({
          character_id: character.id,
          item_id: itemId
        })
        .first();

      if (!inventoryItem) {
        return reply.code(400).send({
          error: 'Item not in inventory'
        });
      }

      // Get item details
      const item = await db('items').where('id', itemId).first();

      // Check if item is equipped - can't sell equipped items
      const equipped = await db('character_equipment')
        .where({
          character_id: character.id,
          item_id: itemId
        })
        .first();

      if (equipped) {
        return reply.code(400).send({
          error: 'Cannot sell equipped item. Unequip it first.'
        });
      }

      // Sell for 50% of purchase price
      const sellPrice = Math.floor(item.price * 0.5);

      // Sell item (add coins and remove from inventory)
      await db.transaction(async trx => {
        // Add coins
        await trx('characters')
          .where('id', character.id)
          .increment('coins', sellPrice);

        // Remove from inventory
        await trx('character_inventory')
          .where({
            character_id: character.id,
            item_id: itemId
          })
          .delete();
      });

      return reply.send({
        message: 'Item sold successfully',
        item: {
          name: item.name
        },
        coinsReceived: sellPrice,
        newBalance: character.coins + sellPrice
      });

    } catch (error) {
      fastify.log.error('Sell item error:', error);
      return reply.code(500).send({
        error: 'Failed to sell item'
      });
    }
  });
};
