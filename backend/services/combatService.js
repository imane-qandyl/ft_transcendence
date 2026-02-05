/**
 * Combat Service - Street Pixel Wars
 * Handles all combat calculations and battle logic
 */

class CombatService {
  /**
   * Calculate effective critical chance based on level scaling
   * Higher level players need more critical investment to maintain same percentage
   * @param {number} baseCritical - Raw critical stat value
   * @param {number} level - Character level
   * @returns {number} - Effective critical chance (0.01 to 0.4)
   */
  getEffectiveCriticalChance(baseCritical, level) {
    // Base critical chance from stats (1-40%)
    // Scaling: reduces effectiveness by 2% per level above 1
    // At level 1: 10% crit = 10% chance
    // At level 5: 10% crit = 10% - (4 * 2%) = 2% chance
    // This forces players to keep upgrading
    const levelPenalty = (level - 1) * 2; // 2% penalty per level above 1
    const effectiveCrit = Math.max(1, baseCritical - levelPenalty); // Minimum 1%
    return Math.min(effectiveCrit / 100, 0.40); // Cap at 40%
  }

  /**
   * Calculate effective luck (opponent miss chance) based on level scaling
   * @param {number} baseLuck - Raw luck stat value
   * @param {number} level - Character level
   * @returns {number} - Effective luck (0.01 to 0.48)
   */
  getEffectiveLuck(baseLuck, level) {
    // Base luck from stats (1-48%)
    // Scaling: reduces effectiveness by 2% per level above 1
    const levelPenalty = (level - 1) * 2; // 2% penalty per level above 1
    const effectiveLuck = Math.max(1, baseLuck - levelPenalty); // Minimum 1%
    return Math.min(effectiveLuck / 100, 0.48); // Cap at 48%
  }

  /**
   * Calculate damage dealt by attacker to defender
   * @param {Object} attacker - Attacker character with stats
   * @param {Object} defender - Defender character with stats
   * @param {string} action - Action type: 'attack', 'defend', 'special'
   * @returns {Object} - Damage dealt and additional info
   */
  calculateDamage(attacker, defender, action) {
    let baseDamage = attacker.attack;
    let effectiveDefense = defender.defense;
    let multiplier = 1.0;
    let accuracy = 1.0;

    // Handle different action types
    if (action === 'defend') {
      // Defender doesn't deal damage
      return { damage: 0, isCritical: false, missed: false, luckyDodge: false };
    }

    if (action === 'special') {
      // Special attack: 1.5x damage but 80% accuracy
      multiplier = 1.5;
      accuracy = 0.8;
    }

    // Check if attack misses (for special attacks)
    if (Math.random() > accuracy) {
      return { damage: 0, isCritical: false, missed: true, luckyDodge: false };
    }

    // Check defender's luck (chance for attacker to miss due to luck)
    const defenderLuck = this.getEffectiveLuck(defender.luck || 5, defender.level || 1);
    if (Math.random() < defenderLuck) {
      return { damage: 0, isCritical: false, missed: false, luckyDodge: true };
    }

    // If defender is defending this turn, double their defense
    if (defender.isDefending) {
      effectiveDefense *= 2;
    }

    // Calculate raw damage
    let rawDamage = baseDamage - (effectiveDefense * 0.5);
    rawDamage *= multiplier;

    // Level difference damage scaling
    // Attack higher level = deal less damage, attack lower level = deal more damage
    const attackerLevel = attacker.level || 1;
    const defenderLevel = defender.level || 1;
    const levelDiff = attackerLevel - defenderLevel;

    let levelMultiplier;
    if (levelDiff < 0) {
      // Attacker is LOWER level than defender: reduce damage
      // -1 level = 90% damage, -5 levels = 50% damage, -10 levels = 25% damage
      levelMultiplier = Math.max(0.25, 1 + (levelDiff * 0.10));
    } else if (levelDiff > 0) {
      // Attacker is HIGHER level than defender: bonus damage (small)
      // +1 level = 105% damage, +5 levels = 125% damage (capped)
      levelMultiplier = Math.min(1.25, 1 + (levelDiff * 0.05));
    } else {
      levelMultiplier = 1.0;
    }

    rawDamage *= levelMultiplier;

    // Minimum 1 damage
    rawDamage = Math.max(1, rawDamage);

    // Add variance (±10%)
    const variance = rawDamage * 0.1;
    rawDamage = rawDamage + (Math.random() * variance * 2 - variance);

    // Critical hit chance based on attacker's critical stat with level scaling
    const criticalChance = this.getEffectiveCriticalChance(attacker.critical || 10, attacker.level || 1);
    const isCritical = Math.random() < criticalChance;
    if (isCritical) {
      rawDamage *= 1.5; // 50% bonus damage on critical
    }

    const finalDamage = Math.floor(rawDamage);

    return {
      damage: finalDamage,
      isCritical,
      missed: false,
      luckyDodge: false
    };
  }

  /**
   * Determine turn order randomly
   * @param {Object} player1 - First player character
   * @param {Object} player2 - Second player character
   * @returns {string} - ID of player who goes first
   */
  determineTurnOrder(player1, player2) {
    // Completely random who goes first
    return Math.random() < 0.5 ? player1.id : player2.id;
  }

  /**
   * Calculate XP reward based on level difference
   * Beat higher level = more XP, beat lower level = less XP
   * @param {number} winnerLevel - Winner's level
   * @param {number} loserLevel - Loser's level
   * @returns {number} - XP rewarded
   */
  calculateXPReward(winnerLevel, loserLevel) {
    const baseXP = 100;
    const levelDiff = loserLevel - winnerLevel;

    // Level difference scaling:
    // Beat someone +5 levels higher: 100 * 2.5 = 250 XP
    // Beat someone same level: 100 * 1.0 = 100 XP
    // Beat someone -5 levels lower: 100 * 0.25 = 25 XP
    let multiplier;
    if (levelDiff > 0) {
      // Beating higher level: +30% per level above you (max 3x)
      multiplier = Math.min(3.0, 1 + (levelDiff * 0.30));
    } else if (levelDiff < 0) {
      // Beating lower level: -15% per level below you (min 0.1x)
      multiplier = Math.max(0.1, 1 + (levelDiff * 0.15));
    } else {
      multiplier = 1.0;
    }

    const finalXP = Math.floor(baseXP * multiplier);
    return Math.max(10, finalXP); // Minimum 10 XP
  }

  /**
   * Calculate coin reward based on level difference
   * Beat higher level = more coins, beat lower level = less coins
   * @param {number} winnerLevel - Winner's level
   * @param {number} loserLevel - Loser's level (optional, defaults to same level)
   * @returns {number} - Coins rewarded
   */
  calculateCoinReward(winnerLevel, loserLevel = null) {
    // If no loser level provided, assume same level (backwards compatibility)
    if (loserLevel === null) {
      loserLevel = winnerLevel;
    }

    const baseCoins = 50 + (winnerLevel * 5);
    const levelDiff = loserLevel - winnerLevel;

    // Level difference scaling:
    // Beat someone +5 levels higher: base * 2.0 = double coins
    // Beat someone same level: base * 1.0 = normal coins
    // Beat someone -5 levels lower: base * 0.3 = 30% coins
    let multiplier;
    if (levelDiff > 0) {
      // Beating higher level: +20% per level above you (max 2.5x)
      multiplier = Math.min(2.5, 1 + (levelDiff * 0.20));
    } else if (levelDiff < 0) {
      // Beating lower level: -14% per level below you (min 0.2x)
      multiplier = Math.max(0.2, 1 + (levelDiff * 0.14));
    } else {
      multiplier = 1.0;
    }

    const finalCoins = Math.floor(baseCoins * multiplier);
    return Math.max(10, finalCoins); // Minimum 10 coins
  }

  /**
   * Calculate ELO rating change
   * @param {number} playerElo - Player's current ELO
   * @param {number} opponentElo - Opponent's current ELO
   * @param {boolean} won - Whether player won
   * @returns {number} - ELO change (positive or negative)
   */
  calculateEloChange(playerElo, opponentElo, won) {
    const K = 32; // K-factor for chess-style ELO

    // Expected score formula
    const expected = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));

    // Actual score
    const actual = won ? 1 : 0;

    // ELO change
    return Math.round(K * (actual - expected));
  }

  /**
   * Calculate XP needed for next level
   * @param {number} currentLevel - Current level
   * @returns {number} - XP needed for next level
   */
  getXPForNextLevel(currentLevel) {
    return 100 * currentLevel * 1.5;
  }

  /**
   * Check if character leveled up and calculate new stats
   * @param {Object} character - Character object
   * @returns {Object|null} - Level up data or null
   */
  checkLevelUp(character) {
    const xpNeeded = this.getXPForNextLevel(character.level);

    if (character.experience >= xpNeeded) {
      const newLevel = character.level + 1;
      const remainingXP = character.experience - xpNeeded;

      // Stat increases per level
      const statIncrease = {
        max_health: 10,
        attack: 3,
        defense: 2,
        speed: 1
      };

      // Grant 3 free stat points on level up
      const statPointsGranted = 3;

      return {
        newLevel,
        remainingXP,
        statIncrease,
        statPointsGranted
      };
    }

    return null;
  }

  /**
   * Get character total stats including equipment
   * @param {Object} character - Base character stats
   * @param {Array} equipment - Array of equipped items
   * @returns {Object} - Total stats
   */
  calculateTotalStats(character, equipment = []) {
    const stats = {
      max_health: character.max_health,
      attack: character.attack,
      defense: character.defense,
      speed: character.speed,
      critical: character.critical || 10,
      luck: character.luck || 5
    };

    // Add equipment bonuses
    equipment.forEach(item => {
      if (item) {
        stats.max_health += item.health_bonus || 0;
        stats.attack += item.attack_bonus || 0;
        stats.defense += item.defense_bonus || 0;
        stats.speed += item.speed_bonus || 0;
        // Equipment could also add critical/luck bonuses if implemented
        stats.critical += item.critical_bonus || 0;
        stats.luck += item.luck_bonus || 0;
      }
    });

    // Cap percentage stats
    stats.critical = Math.min(stats.critical, 40);
    stats.luck = Math.min(stats.luck, 48);

    return stats;
  }

  /**
   * Validate action is legal
   * @param {string} action - Action to validate
   * @returns {boolean} - Whether action is valid
   */
  isValidAction(action) {
    return ['attack', 'defend', 'special'].includes(action);
  }
}

module.exports = new CombatService();
