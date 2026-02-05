/**
 * Territory Service - Street Pixel Wars
 * Handles territory control, battles, and passive income
 */

const knex = require('../db');

class TerritoryService {
  /**
   * Get all territories with ownership info
   * @returns {Array} - Territories with owners
   */
  async getAllTerritories() {
    const territories = await knex('territories')
      .leftJoin('territory_ownership', 'territories.id', 'territory_ownership.territory_id')
      .leftJoin('characters', 'territory_ownership.character_id', 'characters.id')
      .select(
        'territories.*',
        'territory_ownership.character_id as owner_id',
        'territory_ownership.captured_at',
        'territory_ownership.total_income_earned',
        'characters.name as owner_name',
        'characters.level as owner_level'
      );

    return territories;
  }

  /**
   * Get territories owned by a character
   * @param {string} characterId - Character ID
   * @returns {Array} - Owned territories
   */
  async getCharacterTerritories(characterId) {
    const territories = await knex('territories')
      .join('territory_ownership', 'territories.id', 'territory_ownership.territory_id')
      .where('territory_ownership.character_id', characterId)
      .select('territories.*', 'territory_ownership.captured_at', 'territory_ownership.total_income_earned');

    return territories;
  }

  /**
   * Attack a territory
   * @param {string} territoryId - Territory to attack
   * @param {string} attackerId - Attacking character ID
   * @returns {Object} - Battle result
   */
  async attackTerritory(territoryId, attackerId) {
    // Get territory info
    const territory = await knex('territories').where('id', territoryId).first();

    if (!territory) {
      throw new Error('Territory not found');
    }

    // Get attacker info
    const attacker = await knex('characters').where('id', attackerId).first();

    if (!attacker) {
      throw new Error('Attacker not found');
    }

    // Check level requirement
    if (attacker.level < territory.level_required) {
      throw new Error(`Level ${territory.level_required} required to attack this territory`);
    }

    // Get current owner (if any)
    const ownership = await knex('territory_ownership')
      .where('territory_id', territoryId)
      .first();

    let defender = null;
    let defenderPower = territory.defense_strength;

    if (ownership && ownership.character_id) {
      // Territory has an owner
      defender = await knex('characters').where('id', ownership.character_id).first();

      // Calculate defender power (base defense + owner stats)
      defenderPower = territory.defense_strength + (defender.defense * 2) + (defender.level * 5);
    }

    // Calculate attacker power
    const attackerPower = (attacker.attack * 3) + (attacker.level * 10) + Math.floor(Math.random() * 50);

    // Determine winner
    const successfulCapture = attackerPower > defenderPower;
    const winnerId = successfulCapture ? attackerId : (defender ? defender.id : null);

    // Record battle
    await knex('territory_battles').insert({
      territory_id: territoryId,
      attacker_id: attackerId,
      defender_id: defender ? defender.id : null,
      winner_id: winnerId,
      successful_capture: successfulCapture,
      attacker_power: attackerPower,
      defender_power: defenderPower
    });

    if (successfulCapture) {
      // Transfer ownership
      if (ownership) {
        // Update existing ownership
        await knex('territory_ownership')
          .where('territory_id', territoryId)
          .update({
            character_id: attackerId,
            captured_at: knex.fn.now(),
            total_income_earned: 0
          });

        // Decrement previous owner's territory count
        if (ownership.character_id) {
          await knex('character_resources')
            .where('character_id', ownership.character_id)
            .decrement('total_territories_captured', 1);
        }
      } else {
        // Create new ownership
        await knex('territory_ownership').insert({
          territory_id: territoryId,
          character_id: attackerId,
          captured_at: knex.fn.now(),
          total_income_earned: 0
        });
      }

      // Increment attacker's territory count
      await knex('character_resources')
        .where('character_id', attackerId)
        .increment('total_territories_captured', 1);

      // Reward XP for capturing
      const xpReward = territory.level_required * 50;
      await knex('characters')
        .where('id', attackerId)
        .increment('experience', xpReward);

      return {
        success: true,
        message: `Successfully captured ${territory.name}!`,
        xpReward,
        attackerPower,
        defenderPower,
        territory
      };
    } else {
      return {
        success: false,
        message: `Failed to capture ${territory.name}. Defense was too strong.`,
        attackerPower,
        defenderPower,
        territory
      };
    }
  }

  /**
   * Collect passive income from all owned territories
   * @param {string} characterId - Character ID
   * @returns {Object} - Income collected
   */
  async collectIncome(characterId) {
    const ownedTerritories = await knex('territory_ownership')
      .join('territories', 'territory_ownership.territory_id', 'territories.id')
      .where('territory_ownership.character_id', characterId)
      .select(
        'territories.id',
        'territories.name',
        'territories.income_per_hour',
        'territory_ownership.captured_at'
      );

    if (ownedTerritories.length === 0) {
      return {
        totalIncome: 0,
        territories: []
      };
    }

    let totalIncome = 0;
    const now = Date.now();

    const incomeDetails = ownedTerritories.map(territory => {
      // Calculate hours since capture
      const capturedAt = new Date(territory.captured_at).getTime();
      const hoursSinceCapture = Math.floor((now - capturedAt) / (1000 * 60 * 60));

      // Calculate income (up to 24 hours max)
      const hoursToCollect = Math.min(hoursSinceCapture, 24);
      const income = territory.income_per_hour * hoursToCollect;

      totalIncome += income;

      return {
        territoryId: territory.id,
        name: territory.name,
        income,
        hoursCollected: hoursToCollect
      };
    });

    // Update character coins
    await knex('characters')
      .where('id', characterId)
      .increment('coins', totalIncome);

    // Update total income earned for each territory
    for (const detail of incomeDetails) {
      await knex('territory_ownership')
        .where('territory_id', detail.territoryId)
        .increment('total_income_earned', detail.income)
        .update('captured_at', knex.fn.now()); // Reset timer
    }

    return {
      totalIncome,
      territories: incomeDetails
    };
  }

  /**
   * Get territory battle history
   * @param {string} territoryId - Territory ID
   * @param {number} limit - Number of battles to return
   * @returns {Array} - Battle history
   */
  async getTerritoryHistory(territoryId, limit = 10) {
    const battles = await knex('territory_battles')
      .join('characters as attacker', 'territory_battles.attacker_id', 'attacker.id')
      .leftJoin('characters as defender', 'territory_battles.defender_id', 'defender.id')
      .where('territory_battles.territory_id', territoryId)
      .orderBy('territory_battles.battled_at', 'desc')
      .limit(limit)
      .select(
        'territory_battles.*',
        'attacker.name as attacker_name',
        'attacker.level as attacker_level',
        'defender.name as defender_name',
        'defender.level as defender_level'
      );

    return battles;
  }
}

module.exports = new TerritoryService();
