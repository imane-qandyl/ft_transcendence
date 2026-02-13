/**
 * Character Routes - REST API endpoints for character management
 */

// Character class definitions with unique starting stats
// Character class definitions with unique starting stats
const CHARACTER_CLASSES = {
  pink: {
    stats: { hp: 100, attack: 20, defense: 10, speed: 15, critical: 5, luck: 5 },
    bonusType: 'balanced',
    unlockLevel: 1
  },
  owlet: {
    stats: { hp: 120, attack: 15, defense: 15, speed: 12, critical: 3, luck: 8 },
    bonusType: 'tank',
    unlockLevel: 5
  },
  dude: {
    stats: { hp: 95, attack: 24, defense: 7, speed: 15, critical: 5, luck: 3 },
    bonusType: 'brawler',
    unlockLevel: 10
  },
  warrior: {
    stats: { hp: 95, attack: 28, defense: 10, speed: 10, critical: 10, luck: 3 },
    bonusType: 'attacker',
    unlockLevel: 15
  },
  mage: {
    stats: { hp: 75, attack: 22, defense: 6, speed: 18, critical: 15, luck: 10 },
    bonusType: 'crit',
    unlockLevel: 20
  },
  rogue: {
    stats: { hp: 90, attack: 20, defense: 8, speed: 20, critical: 7, luck: 15 },
    bonusType: 'lucky',
    unlockLevel: 25
  }
};

// Level required to unlock additional character slots
const SLOT_UNLOCK_LEVELS = {
  1: 0,   // Slot 1: Available from start
  2: 20,  // Slot 2: Unlocks at level 20
  3: 40   // Slot 3: Unlocks at level 40 (future)
};

const MAX_CHARACTER_SLOTS = 3;

module.exports = async function(fastify, options) {
  const db = fastify.knex || options.db;

  /**
   * Helper function to get max unlocked slots based on user's highest level character
   */
  async function getMaxUnlockedSlots(userId) {
    const highestLevelChar = await db('characters')
      .where('user_id', userId)
      .orderBy('level', 'desc')
      .first();

    if (!highestLevelChar) {
      return 1; // First slot always available
    }

    let unlockedSlots = 1;
    for (const [slot, requiredLevel] of Object.entries(SLOT_UNLOCK_LEVELS)) {
      if (highestLevelChar.level >= requiredLevel) {
        unlockedSlots = Math.max(unlockedSlots, parseInt(slot));
      }
    }
    return Math.min(unlockedSlots, MAX_CHARACTER_SLOTS);
  }

  /**
   * Get all characters for current user
   * GET /api/v1/characters/all
   */
  fastify.get('/all', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    const userId = request.user.id;

    try {
      const characters = await db('characters')
        .where('user_id', userId)
        .orderBy('slot_number', 'asc')
        .select('*');

      const maxSlots = await getMaxUnlockedSlots(userId);
      const highestLevel = characters.length > 0
        ? Math.max(...characters.map(c => c.level))
        : 0;

      // Calculate next unlock level
      let nextUnlockLevel = null;
      for (const [slot, level] of Object.entries(SLOT_UNLOCK_LEVELS)) {
        if (parseInt(slot) > maxSlots && level > 0) {
          nextUnlockLevel = level;
          break;
        }
      }

      return reply.send({
        characters: characters.map(char => ({
          id: char.id,
          name: char.name,
          level: char.level,
          class: char.selected_character,
          isActive: char.is_active,
          slotNumber: char.slot_number,
          elo_rating: char.elo_rating,
          wins: char.wins,
          losses: char.losses
        })),
        slots: {
          used: characters.length,
          max: maxSlots,
          maxPossible: MAX_CHARACTER_SLOTS,
          nextUnlockLevel,
          highestLevel
        }
      });

    } catch (error) {
      fastify.log.error('Get all characters error:', error);
      return reply.code(500).send({
        error: 'Failed to get characters'
      });
    }
  });

  /**
   * Switch active character
   * POST /api/v1/characters/:characterId/select
   */
  fastify.post('/:characterId/select', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    const userId = request.user.id;
    const { characterId } = request.params;

    try {
      // Verify the character belongs to this user
      const character = await db('characters')
        .where({ id: characterId, user_id: userId })
        .first();

      if (!character) {
        return reply.code(404).send({
          error: 'Character not found'
        });
      }

      // Deactivate all other characters for this user
      await db('characters')
        .where('user_id', userId)
        .update({ is_active: false });

      // Activate the selected character
      await db('characters')
        .where('id', characterId)
        .update({ is_active: true });

      return reply.send({
        message: 'Character selected',
        activeCharacterId: characterId,
        characterName: character.name
      });

    } catch (error) {
      fastify.log.error('Select character error:', error);
      return reply.code(500).send({
        error: 'Failed to select character'
      });
    }
  });

  /**
   * Create a new character
   * POST /api/v1/characters
   */
  fastify.post('/', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    const { name, sprite_body, sprite_hair, sprite_outfit, characterClass } = request.body;
    const userId = request.user.id;

    try {
      fastify.log.info('[CHARACTER CREATE] Received:', { characterClass, sprite_body });

      // Get all existing characters for this user
      const existingCharacters = await db('characters')
        .where('user_id', userId)
        .select('*');

      // Get max unlocked slots
      const maxSlots = await getMaxUnlockedSlots(userId);

      // Check if user has room for another character
      if (existingCharacters.length >= maxSlots) {
        const highestLevel = existingCharacters.length > 0
          ? Math.max(...existingCharacters.map(c => c.level))
          : 0;

        // Find next unlock level
        let nextUnlock = null;
        for (const [slot, level] of Object.entries(SLOT_UNLOCK_LEVELS)) {
          if (level > highestLevel) {
            nextUnlock = level;
            break;
          }
        }

        return reply.code(400).send({
          error: nextUnlock
            ? `All character slots are full. Reach level ${nextUnlock} to unlock another slot.`
            : 'All character slots are full (maximum reached).',
          currentSlots: existingCharacters.length,
          maxSlots,
          nextUnlockLevel: nextUnlock
        });
      }

      // Validate name
      if (!name || name.trim().length < 3 || name.trim().length > 50) {
        return reply.code(400).send({
          error: 'Name must be between 3 and 50 characters'
        });
      }

      // Sanitize name - allow only alphanumeric, spaces, hyphens, underscores
      const sanitizedName = name.trim();
      if (!/^[a-zA-Z0-9 _-]+$/.test(sanitizedName)) {
        return reply.code(400).send({
          error: 'Name can only contain letters, numbers, spaces, hyphens, and underscores'
        });
      }

      // Check if name is taken
      const nameTaken = await db('characters')
        .where('name', sanitizedName)
        .first();

      if (nameTaken) {
        return reply.code(400).send({
          error: 'This character name is already taken'
        });
      }

      // Get character class stats (default to pink if not specified)
      const chosenClass = characterClass || sprite_body || 'pink';
      fastify.log.info('[CHARACTER CREATE] Chosen class:', chosenClass);
      const selectedClass = CHARACTER_CLASSES[chosenClass] || CHARACTER_CLASSES.pink;
      
      // For new players (first character), only allow classes that unlock at level 1
      if (existingCharacters.length === 0 && selectedClass.unlockLevel > 1) {
        return reply.code(400).send({
          error: `${chosenClass} is locked. New players must start with Pink Monster.`
        });
      }
      
      // For additional characters, check if player has reached required level
      if (existingCharacters.length > 0) {
        const highestLevel = Math.max(...existingCharacters.map(c => c.level));
        if (selectedClass.unlockLevel > highestLevel) {
          return reply.code(400).send({
            error: `${chosenClass} is locked. Reach level ${selectedClass.unlockLevel} to unlock this fighter.`,
            requiredLevel: selectedClass.unlockLevel,
            currentLevel: highestLevel
          });
        }
      }
      
      const stats = selectedClass.stats;

      // Calculate next available slot number
      const nextSlotNumber = existingCharacters.length + 1;

      // If creating additional character, deactivate existing ones
      if (existingCharacters.length > 0) {
        await db('characters')
          .where('user_id', userId)
          .update({ is_active: false });
      }

      // Create character with class-specific stats
      // selected_character is set to the chosen class and LOCKED until level 20
      const [character] = await db('characters').insert({
        user_id: userId,
        name: sanitizedName,
        level: 1,
        experience: 0,
        coins: 1000, // Starting coins
        max_health: stats.hp,
        attack: stats.attack,
        defense: stats.defense,
        speed: stats.speed,
        critical: stats.critical,
        luck: stats.luck,
        stat_points: 0, // Free stat points
        elo_rating: 1000,
        wins: 0,
        losses: 0,
        sprite_body: chosenClass, // Store the chosen class
        sprite_hair: sprite_hair || 'hair_short',
        sprite_outfit: sprite_outfit || 'outfit_basic',
        selected_character: chosenClass, // Set selected_character to chosen class (locked until level 20)
        bonus_type: selectedClass.bonusType, // Store the bonus type for upgrades
        slot_number: nextSlotNumber,
        is_active: true // New character becomes active
      }).returning('*');

      return reply.send({
        message: 'Character created successfully',
        character: {
          id: character.id,
          name: character.name,
          level: character.level,
          coins: character.coins,
          stats: {
            max_health: character.max_health,
            attack: character.attack,
            defense: character.defense,
            speed: character.speed
          },
          elo_rating: character.elo_rating
        }
      });

    } catch (error) {
      fastify.log.error('Create character error:', error);
      return reply.code(500).send({
        error: 'Failed to create character'
      });
    }
  });

  /**
   * Get current user's active character
   * GET /api/v1/characters/me
   */
  fastify.get('/me', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    const userId = request.user.id;

    try {
      // First try to get active character
      let character = await db('characters')
        .where({ user_id: userId, is_active: true })
        .select('*')
        .first();

      // If no active character, get any character (for backwards compatibility)
      if (!character) {
        character = await db('characters')
          .where('user_id', userId)
          .select('*')
          .first();

        // If found, mark it as active
        if (character) {
          await db('characters')
            .where('id', character.id)
            .update({ is_active: true });
        }
      }

      // If no character exists, return 200 with null so frontend shows CharacterCreate screen
      if (!character) {
        return reply.send({
          character: null,
          message: 'Please create a character first'
        });
      }

      // Calculate total stats
      const combatService = require('../services/combatService');
      const totalStats = combatService.calculateTotalStats(character);

      return reply.send({
        character: {
          id: character.id,
          name: character.name,
          level: character.level,
          experience: character.experience,
          coins: character.coins,
          stat_points: character.stat_points || 0,
          baseStats: {
            max_health: character.max_health,
            attack: character.attack,
            defense: character.defense,
            speed: character.speed,
            critical: character.critical || 10,
            luck: character.luck || 5
          },
          totalStats,
          elo_rating: character.elo_rating,
          wins: character.wins,
          losses: character.losses,
          customization: {
            sprite_body: character.sprite_body,
            sprite_hair: character.sprite_hair,
            sprite_outfit: character.sprite_outfit,
            selected_character: character.selected_character
          }
        }
      });

    } catch (error) {
      fastify.log.error('Get character error:', error);
      return reply.code(500).send({
        error: 'Failed to get character'
      });
    }
  });

  /**
   * Update character customization
   * PATCH /api/v1/characters/me/customize
   */
  fastify.patch('/me/customize', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    const userId = request.user.id;
    const { sprite_body, sprite_hair, sprite_outfit } = request.body;

    // Whitelist valid customization values
    const VALID_BODIES = ['pink', 'owlet', 'dude', 'warrior', 'mage', 'rogue'];
    const VALID_HAIRS = ['hair_short', 'hair_long', 'hair_mohawk', 'hair_none'];
    const VALID_OUTFITS = ['outfit_basic', 'outfit_armor', 'outfit_robe', 'outfit_ninja'];

    try {
      const character = await db('characters')
        .where('user_id', userId)
        .first();

      if (!character) {
        return reply.code(404).send({
          error: 'No character found'
        });
      }

      const updates = {};
      if (sprite_body) {
        if (!VALID_BODIES.includes(sprite_body)) {
          return reply.code(400).send({ error: 'Invalid sprite_body value' });
        }
        updates.sprite_body = sprite_body;
      }
      if (sprite_hair) {
        if (!VALID_HAIRS.includes(sprite_hair)) {
          return reply.code(400).send({ error: 'Invalid sprite_hair value' });
        }
        updates.sprite_hair = sprite_hair;
      }
      if (sprite_outfit) {
        if (!VALID_OUTFITS.includes(sprite_outfit)) {
          return reply.code(400).send({ error: 'Invalid sprite_outfit value' });
        }
        updates.sprite_outfit = sprite_outfit;
      }

      if (Object.keys(updates).length > 0) {
        await db('characters')
          .where('id', character.id)
          .update(updates);
      }

      return reply.send({
        message: 'Character customization updated',
        customization: updates
      });

    } catch (error) {
      fastify.log.error('Update character error:', error);
      return reply.code(500).send({
        error: 'Failed to update character'
      });
    }
  });

  /**
   * Upgrade character stats with coins or free stat points
   * POST /api/v1/characters/me/upgrade
   */
  fastify.post('/me/upgrade', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    const userId = request.user.id;
    const { stat, useFreePoints } = request.body; // stat: 'attack', 'defense', 'max_health', 'speed', 'critical', 'luck'

    // Cost per upgrade (increases with level)
    const UPGRADE_COSTS = {
      attack: 100,
      defense: 100,
      max_health: 150,
      speed: 120,
      critical: 200, // Critical is more expensive
      luck: 200 // Luck is more expensive
    };

    // Base stat increase per upgrade
    const BASE_STAT_INCREASES = {
  attack: 5,
  defense: 3,
  max_health: 20, // Increased from 10 to 20 per upgrade
  speed: 2,
  critical: 2, // +2% critical chance per upgrade
  luck: 2 // +2% luck per upgrade
    };

    // Class bonus multipliers for upgrades
    const CLASS_BONUSES = {
      balanced: { attack: 1.1, defense: 1.1, max_health: 1.1, speed: 1.1, critical: 1.1, luck: 1.1 },
      tank: { attack: 1.0, defense: 1.2, max_health: 1.2, speed: 0.9, critical: 1.0, luck: 1.0 },
      speedster: { attack: 1.0, defense: 0.9, max_health: 0.9, speed: 1.25, critical: 1.25, luck: 1.0 },
      attacker: { attack: 1.3, defense: 1.0, max_health: 1.0, speed: 0.9, critical: 1.1, luck: 0.9 },
      crit: { attack: 1.0, defense: 0.9, max_health: 0.9, speed: 1.0, critical: 1.35, luck: 1.35 },
      lucky: { attack: 1.0, defense: 0.9, max_health: 1.0, speed: 1.2, critical: 1.0, luck: 1.4 }
    };

    // Max caps for percentage stats (these are raw values, not percentages after level scaling)
    const STAT_CAPS = {
      critical: 40, // Max 40% critical chance
      luck: 48 // Max 48% luck (opponent miss chance)
    };

    try {
      // Validate stat
      if (!UPGRADE_COSTS[stat]) {
        return reply.code(400).send({
          error: 'Invalid stat. Choose: attack, defense, max_health, speed, critical, or luck'
        });
      }

      const character = await db('characters')
        .where('user_id', userId)
        .first();

      if (!character) {
        return reply.code(404).send({
          error: 'No character found'
        });
      }

      // Check stat cap for percentage stats
      if (STAT_CAPS[stat] && character[stat] >= STAT_CAPS[stat]) {
        return reply.code(400).send({
          error: `${stat} is already at maximum (${STAT_CAPS[stat]}%)`
        });
      }

      // Get class bonus multiplier
      const bonusType = character.bonus_type || 'balanced';
      const classBonus = CLASS_BONUSES[bonusType] || CLASS_BONUSES.balanced;
      const bonusMultiplier = classBonus[stat] || 1.0;

      // Calculate actual stat increase with class bonus
      const baseIncrease = BASE_STAT_INCREASES[stat];
      const increase = Math.floor(baseIncrease * bonusMultiplier);

      // Calculate cost (base cost * (1 + level * 0.1))
      const cost = Math.floor(UPGRADE_COSTS[stat] * (1 + character.level * 0.1));

      // Check if using free stat points or coins
      if (useFreePoints) {
        if (!character.stat_points || character.stat_points < 1) {
          return reply.code(400).send({
            error: 'No free stat points available'
          });
        }

        // Perform upgrade with free stat points
        const newValue = Math.min(
          character[stat] + increase,
          STAT_CAPS[stat] || Infinity
        );

        await db('characters')
          .where('id', character.id)
          .update({
            [stat]: newValue,
            stat_points: character.stat_points - 1
          });

        // Get updated character
        const updated = await db('characters')
          .where('id', character.id)
          .first();

        return reply.send({
          message: `${stat} upgraded with free point! (+${increase} with ${bonusType} bonus)`,
          stat,
          oldValue: character[stat],
          newValue: updated[stat],
          increase,
          bonusType,
          cost: 0,
          usedFreePoint: true,
          remainingStatPoints: updated.stat_points,
          remainingCoins: updated.coins
        });
      }

      // Check if player has enough coins
      if (character.coins < cost) {
        return reply.code(400).send({
          error: `Not enough coins. Need ${cost}, have ${character.coins}`
        });
      }

      // Perform upgrade with coins
      const newValue = Math.min(
        character[stat] + increase,
        STAT_CAPS[stat] || Infinity
      );

      await db('characters')
        .where('id', character.id)
        .update({
          [stat]: newValue,
          coins: character.coins - cost
        });

      // Get updated character
      const updated = await db('characters')
        .where('id', character.id)
        .first();

      return reply.send({
        message: `${stat} upgraded successfully! (+${increase} with ${bonusType} bonus)`,
        stat,
        oldValue: character[stat],
        newValue: updated[stat],
        increase,
        bonusType,
        cost,
        usedFreePoint: false,
        remainingStatPoints: updated.stat_points || 0,
        remainingCoins: updated.coins
      });

    } catch (error) {
      fastify.log.error('Upgrade stat error:', error);
      return reply.code(500).send({
        error: 'Failed to upgrade stat'
      });
    }
  });

  /**
   * Update selected character sprite (pink, owlet, dude, warrior, mage, rogue)
   * PATCH /api/v1/characters/me/select-sprite
   */
  fastify.patch('/me/select-sprite', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    const userId = request.user.id;
    const { selectedCharacter } = request.body;

    const VALID_SPRITES = ['pink', 'owlet', 'dude', 'warrior', 'mage', 'rogue'];
    const UNLOCK_LEVEL = 5; // Level required to change character

    try {
      if (!VALID_SPRITES.includes(selectedCharacter)) {
        return reply.code(400).send({
          error: 'Invalid character. Choose: pink, owlet, dude, warrior, mage, or rogue'
        });
      }

      const character = await db('characters')
        .where('user_id', userId)
        .first();

      if (!character) {
        return reply.code(404).send({
          error: 'No character found'
        });
      }

      // Check if player is high enough level to change character
      if (character.level < UNLOCK_LEVEL) {
        return reply.code(403).send({
          error: `You must reach level ${UNLOCK_LEVEL} to change your character class. Current level: ${character.level}`,
          requiredLevel: UNLOCK_LEVEL,
          currentLevel: character.level
        });
      }

      await db('characters')
        .where('id', character.id)
        .update({
          selected_character: selectedCharacter
        });

      return reply.send({
        message: 'Character sprite selected',
        selectedCharacter
      });

    } catch (error) {
      fastify.log.error('Select sprite error:', error);
      return reply.code(500).send({
        error: 'Failed to select character sprite'
      });
    }
  });
};
