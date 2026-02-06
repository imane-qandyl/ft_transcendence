/**
 * AI Opponent Service - Street Pixel Wars
 * Intelligent AI that makes tactical combat decisions
 */

class AIOpponentService {
  constructor() {
    this.AI_DELAY = 2000; // 2 second thinking delay for realism
  }

  /**
   * Create an AI character based on player's level/ELO for balanced gameplay
   * @param {Object} playerCharacter - Human player's character
   * @returns {Object} - AI character stats
   */
  createAICharacter(playerCharacter) {
    const playerLevel = playerCharacter.level || 1;
    const playerElo = playerCharacter.elo_rating || 1000;

    // AI stats scale with player but with slight variation for unpredictability
    const variance = () => Math.random() * 0.2 - 0.1; // ±10% variance

    const aiCharacter = {
      id: `ai_${Date.now()}`,
      user_id: 'ai',
      name: this.generateAIName(playerLevel),
      level: Math.max(1, playerLevel + Math.floor(Math.random() * 3 - 1)), // ±1 level
      experience: playerCharacter.experience || 0,
      coins: 0, // AI doesn't need coins
      
      // Stats with slight variance for unpredictability
      max_health: Math.floor((playerCharacter.max_health || 100) * (1 + variance())),
      attack: Math.floor((playerCharacter.attack || 20) * (1 + variance())),
      defense: Math.floor((playerCharacter.defense || 10) * (1 + variance())),
      speed: Math.floor((playerCharacter.speed || 15) * (1 + variance())),
      critical: Math.floor((playerCharacter.critical || 10) * (1 + variance())),
      luck: Math.floor((playerCharacter.luck || 5) * (1 + variance())),
      
      stat_points: 0,
      elo_rating: playerElo + Math.floor(Math.random() * 100 - 50), // ±50 ELO variance
      wins: Math.floor(Math.random() * 50),
      losses: Math.floor(Math.random() * 50),
      
      // Visual appearance
      sprite_body: this.getRandomSprite('body'),
      sprite_hair: this.getRandomSprite('hair'),
      sprite_face: this.getRandomSprite('face'),
      
      // AI-specific flags
      isAI: true,
      difficulty: this.calculateDifficulty(playerLevel, playerElo)
    };

    return aiCharacter;
  }

  /**
   * Make AI decision based on battle state
   * @param {Object} aiPlayer - AI player state
   * @param {Object} humanPlayer - Human player state
   * @param {Object} matchState - Current match state
   * @returns {Promise<string>} - AI action: 'attack', 'defend', 'special'
   */
  async makeDecision(aiPlayer, humanPlayer, matchState) {
    // Add realistic thinking delay
    await new Promise(resolve => setTimeout(resolve, this.AI_DELAY));

    const aiHealth = aiPlayer.currentHealth / aiPlayer.maxHealth;
    const humanHealth = humanPlayer.currentHealth / humanPlayer.maxHealth;
    const turnNumber = matchState.turnNumber;
    const difficulty = aiPlayer.character.difficulty;

    // Calculate decision weights based on game state
    const weights = this.calculateActionWeights(aiPlayer, humanPlayer, matchState);
    
    // Apply difficulty modifiers
    this.applyDifficultyModifier(weights, difficulty, turnNumber);

    // Choose action based on weighted probabilities
    const action = this.selectWeightedAction(weights);

    console.log(`AI ${aiPlayer.character.name} (${difficulty}) chose: ${action}`, weights);
    
    return action;
  }

  /**
   * Calculate base action weights based on game state
   */
  calculateActionWeights(aiPlayer, humanPlayer, matchState) {
    const aiHealthPercent = aiPlayer.currentHealth / aiPlayer.maxHealth;
    const humanHealthPercent = humanPlayer.currentHealth / humanPlayer.maxHealth;
    const turnNumber = matchState.turnNumber;

    const weights = {
      attack: 40,    // Base attack preference
      defend: 20,    // Base defense preference  
      special: 15    // Base special preference
    };

    // Health-based adjustments
    if (aiHealthPercent < 0.3) {
      // AI is low health - more defensive
      weights.defend += 30;
      weights.attack -= 15;
    } else if (aiHealthPercent > 0.7 && humanHealthPercent < 0.5) {
      // AI healthy, human weak - more aggressive
      weights.attack += 20;
      weights.special += 15;
      weights.defend -= 10;
    }

    // Turn-based strategy
    if (turnNumber <= 2) {
      // Early game - more aggressive
      weights.attack += 15;
      weights.special += 10;
    } else if (turnNumber > 10) {
      // Late game - finish them off
      weights.special += 25;
      weights.attack += 10;
    }

    // Stat comparison adjustments
    const attackDiff = aiPlayer.attack - humanPlayer.defense;
    const speedDiff = aiPlayer.speed - humanPlayer.speed;

    if (attackDiff > 10) {
      weights.attack += 15; // AI has attack advantage
    } else if (attackDiff < -10) {
      weights.defend += 20; // Human has defense advantage
    }

    if (speedDiff > 5) {
      weights.special += 10; // AI is faster, special more likely to hit
    }

    // Critical/luck considerations
    if (aiPlayer.critical > 25) {
      weights.attack += 10; // High crit chance
    }
    if (humanPlayer.luck > 20) {
      weights.special -= 5; // Human likely to dodge
    }

    return weights;
  }

  /**
   * Apply difficulty-based modifications to action weights
   */
  applyDifficultyModifier(weights, difficulty, turnNumber) {
    switch (difficulty) {
      case 'easy':
        // Easy AI makes suboptimal choices
        weights.defend += 20;
        weights.special -= 10;
        if (Math.random() < 0.3) {
          // 30% chance to make random bad decision
          weights.attack = Math.random() < 0.5 ? 10 : 60;
        }
        break;

      case 'medium':
        // Medium AI is balanced but not perfect
        if (Math.random() < 0.15) {
          // 15% chance for suboptimal play
          const randomAction = ['attack', 'defend', 'special'][Math.floor(Math.random() * 3)];
          weights[randomAction] += 25;
        }
        break;

      case 'hard':
        // Hard AI plays optimally
        weights.special += 10;
        if (turnNumber > 5) {
          weights.attack += 15; // More aggressive in mid/late game
        }
        break;

      case 'expert':
        // Expert AI with advanced tactics
        weights.special += 15;
        weights.attack += 10;
        // Expert AI adapts to patterns (simplified)
        if (turnNumber % 3 === 0) {
          weights.defend += 20; // Periodic defensive play
        }
        break;
    }
  }

  /**
   * Select action based on weighted probabilities
   */
  selectWeightedAction(weights) {
    const totalWeight = weights.attack + weights.defend + weights.special;
    const random = Math.random() * totalWeight;

    if (random < weights.attack) {
      return 'attack';
    } else if (random < weights.attack + weights.defend) {
      return 'defend';  
    } else {
      return 'special';
    }
  }

  /**
   * Calculate AI difficulty based on player stats
   */
  calculateDifficulty(playerLevel, playerElo) {
    if (playerLevel <= 2 || playerElo < 900) {
      return 'easy';
    } else if (playerLevel <= 5 || playerElo < 1100) {
      return 'medium';
    } else if (playerLevel <= 10 || playerElo < 1300) {
      return 'hard';
    } else {
      return 'expert';
    }
  }

  /**
   * Generate appropriate AI name based on level
   */
  generateAIName(playerLevel) {
    const names = {
      easy: ['Rookie Bot', 'Training Dummy', 'Newbie AI', 'Practice Bot'],
      medium: ['Street Fighter', 'City Challenger', 'Cyber Punk', 'Digital Warrior'],
      hard: ['Elite Enforcer', 'Combat Veteran', 'Boss Fighter', 'Street Legend'],
      expert: ['The Terminator', 'Shadow Master', 'Code Reaper', 'Pixel Destroyer']
    };

    const difficulty = this.calculateDifficulty(playerLevel, 1000);
    const nameArray = names[difficulty];
    return nameArray[Math.floor(Math.random() * nameArray.length)];
  }

  /**
   * Get random sprite for visual variety
   */
  getRandomSprite(type) {
    const sprites = {
      body: ['body_base', 'body_muscular', 'body_slim', 'body_heavy'],
      hair: ['hair_short', 'hair_long', 'hair_spiky', 'hair_bald'],
      face: ['face_normal', 'face_angry', 'face_cool', 'face_scarred']
    };

    const spriteArray = sprites[type] || sprites.body;
    return spriteArray[Math.floor(Math.random() * spriteArray.length)];
  }

  /**
   * Process AI turn with realistic timing
   */
  async processAITurn(matchId, gameService) {
    try {
      const match = gameService.activeMatches.get(matchId);
      if (!match || match.status !== 'active') {
        return;
      }

      // Determine which player is AI
      const isPlayer1AI = match.player1.character.isAI;
      const isPlayer2AI = match.player2.character.isAI;
      
      if (!isPlayer1AI && !isPlayer2AI) {
        return; // No AI in this match
      }

      // Check whose turn it is
      const aiPlayer = isPlayer1AI ? match.player1 : match.player2;
      const humanPlayer = isPlayer1AI ? match.player2 : match.player1;

      if (match.currentTurn !== aiPlayer.character.id) {
        return; // Not AI's turn
      }

      // Make AI decision
      const action = await this.makeDecision(aiPlayer, humanPlayer, match);

      // Process the action
      const result = await gameService.processAction(matchId, aiPlayer.userId, action);

      // Broadcast the result
      const gameHandler = require('../socketHandlers/gameHandler');
      gameHandler.broadcastToMatch(matchId, 'action_result', {
        playerId: aiPlayer.userId,
        action,
        result,
        matchState: gameService.getPublicMatchState(match)
      });

      // If match isn't finished and it's still AI's turn somehow, schedule next turn
      if (!result.finished && match.currentTurn === aiPlayer.character.id) {
        setTimeout(() => this.processAITurn(matchId, gameService), 1000);
      }

    } catch (error) {
      console.error('Error processing AI turn:', error);
    }
  }
}

module.exports = new AIOpponentService();