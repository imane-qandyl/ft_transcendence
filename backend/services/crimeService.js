/**
 * Crime Service - Street Pixel Wars
 * Handles crime activities, energy system, and rewards
 */

const knex = require('../db');

class CrimeService {
  /**
   * Get all available crimes
   * @param {number} characterLevel - Character level to filter by
   * @returns {Array} - Available crimes
   */
  async getAvailableCrimes(characterLevel) {
    const crimes = await knex('crime_activities')
      .where('level_required', '<=', characterLevel)
      .orderBy('level_required', 'asc');

    return crimes;
  }

  /**
   * Start a crime activity
   * @param {string} characterId - Character ID
   * @param {string} crimeId - Crime activity ID
   * @returns {Object} - Crime attempt result
   */
  async startCrime(characterId, crimeId) {
    // Get character info
    const character = await knex('characters').where('id', characterId).first();

    if (!character) {
      throw new Error('Character not found');
    }

    // Get crime info
    const crime = await knex('crime_activities').where('id', crimeId).first();

    if (!crime) {
      throw new Error('Crime activity not found');
    }

    // Check level requirement
    if (character.level < crime.level_required) {
      throw new Error(`Level ${crime.level_required} required for this crime`);
    }

    // Get character resources (energy)
    let resources = await knex('character_resources')
      .where('character_id', characterId)
      .first();

    // Create resources if they don't exist
    if (!resources) {
      [resources] = await knex('character_resources')
        .insert({
          character_id: characterId,
          energy: 100,
          max_energy: 100,
          energy_regen_per_hour: 10,
          last_energy_update: knex.fn.now()
        })
        .returning('*');
    }

    // Regenerate energy based on time passed
    resources = await this.regenerateEnergy(characterId);

    // Check if enough energy
    if (resources.energy < crime.energy_cost) {
      throw new Error(`Not enough energy. Need ${crime.energy_cost}, have ${resources.energy}`);
    }

    // Calculate success chance (base rate + character level bonus)
    const levelBonus = Math.min(character.level * 0.5, 10); // Max +10% from level
    const successChance = Math.min(crime.success_rate + levelBonus, 95); // Max 95% success

    // Determine success
    const randomRoll = Math.random() * 100;
    const success = randomRoll < successChance;

    // Calculate rewards
    let coinsEarned = 0;
    let xpEarned = 0;

    if (success) {
      coinsEarned = Math.floor(
        Math.random() * (crime.coin_reward_max - crime.coin_reward_min) + crime.coin_reward_min
      );
      xpEarned = crime.xp_reward;

      // Update character
      await knex('characters')
        .where('id', characterId)
        .increment({
          coins: coinsEarned,
          experience: xpEarned
        });
    } else {
      // Failed crimes give reduced XP
      xpEarned = Math.floor(crime.xp_reward * 0.1);

      await knex('characters')
        .where('id', characterId)
        .increment('experience', xpEarned);
    }

    // Deduct energy
    await knex('character_resources')
      .where('character_id', characterId)
      .decrement('energy', crime.energy_cost)
      .update('last_energy_update', knex.fn.now());

    // Record crime attempt
    const completedAt = new Date(Date.now() + crime.duration_minutes * 60 * 1000);

    await knex('crime_attempts').insert({
      character_id: characterId,
      crime_id: crimeId,
      success,
      coins_earned: coinsEarned,
      xp_earned: xpEarned,
      energy_spent: crime.energy_cost,
      started_at: knex.fn.now(),
      completed_at: completedAt
    });

    // Increment total crimes if successful
    if (success) {
      await knex('character_resources')
        .where('character_id', characterId)
        .increment('total_crimes_completed', 1);
    }

    return {
      success,
      crime: crime.name,
      coinsEarned,
      xpEarned,
      energySpent: crime.energy_cost,
      energyRemaining: resources.energy - crime.energy_cost,
      message: success
        ? `Successfully completed ${crime.name}!`
        : `Failed ${crime.name}. Better luck next time.`,
      completedAt
    };
  }

  /**
   * Regenerate energy based on time passed
   * @param {string} characterId - Character ID
   * @returns {Object} - Updated resources
   */
  async regenerateEnergy(characterId) {
    const resources = await knex('character_resources')
      .where('character_id', characterId)
      .first();

    if (!resources) {
      return null;
    }

    // Calculate time passed since last update
    const lastUpdate = new Date(resources.last_energy_update).getTime();
    const now = Date.now();
    const hoursPassed = (now - lastUpdate) / (1000 * 60 * 60);

    // Calculate energy regenerated
    const energyRegenerated = Math.floor(hoursPassed * resources.energy_regen_per_hour);

    if (energyRegenerated > 0) {
      const newEnergy = Math.min(resources.energy + energyRegenerated, resources.max_energy);

      await knex('character_resources')
        .where('character_id', characterId)
        .update({
          energy: newEnergy,
          last_energy_update: knex.fn.now()
        });

      return {
        ...resources,
        energy: newEnergy
      };
    }

    return resources;
  }

  /**
   * Get character's crime history
   * @param {string} characterId - Character ID
   * @param {number} limit - Number of records to return
   * @returns {Array} - Crime history
   */
  async getCrimeHistory(characterId, limit = 20) {
    const history = await knex('crime_attempts')
      .join('crime_activities', 'crime_attempts.crime_id', 'crime_activities.id')
      .where('crime_attempts.character_id', characterId)
      .orderBy('crime_attempts.started_at', 'desc')
      .limit(limit)
      .select(
        'crime_attempts.*',
        'crime_activities.name as crime_name',
        'crime_activities.type',
        'crime_activities.difficulty'
      );

    return history;
  }

  /**
   * Get character resources (energy)
   * @param {string} characterId - Character ID
   * @returns {Object} - Character resources
   */
  async getResources(characterId) {
    let resources = await knex('character_resources')
      .where('character_id', characterId)
      .first();

    // Create if doesn't exist
    if (!resources) {
      [resources] = await knex('character_resources')
        .insert({
          character_id: characterId,
          energy: 100,
          max_energy: 100,
          energy_regen_per_hour: 10
        })
        .returning('*');
    }

    // Regenerate energy
    resources = await this.regenerateEnergy(characterId);

    return resources;
  }

  /**
   * Get crime statistics for leaderboard
   * @param {number} limit - Number of top criminals to return
   * @returns {Array} - Top criminals
   */
  async getTopCriminals(limit = 10) {
    const topCriminals = await knex('character_resources')
      .join('characters', 'character_resources.character_id', 'characters.id')
      .orderBy('character_resources.total_crimes_completed', 'desc')
      .limit(limit)
      .select(
        'characters.id',
        'characters.name',
        'characters.level',
        'character_resources.total_crimes_completed',
        'character_resources.total_territories_captured'
      );

    return topCriminals;
  }
}

module.exports = new CrimeService();
