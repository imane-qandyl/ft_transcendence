/**
 * Game Service - Street Pixel Wars
 * Manages active matches and game state
 */

const { v4: uuidv4 } = require('uuid');
const combatService = require('./combatService');
const aiOpponentService = require('./aiOpponentService');

class GameService {
  constructor() {
    // Active matches: Map<matchId, matchState>
    this.activeMatches = new Map();
    this.TURN_TIMEOUT = 30000; // 30 seconds per turn
  }

  /**
   * Create a new match vs AI opponent
   * @param {Object} player - Human player data with socket and character
   * @returns {Object} - Match data with AI opponent
   */
  createAIMatch(player) {
    const matchId = uuidv4();

    // Create AI character based on player's stats and difficulty
    const aiCharacter = aiOpponentService.createAICharacter(
      player.character, 
      player.difficulty
    );
    
    // Create AI player object
    const aiPlayer = {
      userId: 'ai',
      socket: null, // AI doesn't need socket
      character: aiCharacter,
      currentHealth: aiCharacter.max_health,
      maxHealth: aiCharacter.max_health,
      attack: aiCharacter.attack,
      defense: aiCharacter.defense,
      speed: aiCharacter.speed,
      isDefending: false,
      totalDamageDealt: 0
    };

    // Determine who goes first based on speed
    const firstPlayerId = combatService.determineTurnOrder(
      player.character,
      aiCharacter
    );

    const matchState = {
      matchId,
      player1: {
        userId: player.userId,
        socket: player.socket,
        character: player.character,
        currentHealth: player.character.max_health,
        maxHealth: player.character.max_health,
        attack: player.character.attack,
        defense: player.character.defense,
        speed: player.character.speed,
        isDefending: false,
        totalDamageDealt: 0
      },
      player2: aiPlayer,
      currentTurn: firstPlayerId,
      turnNumber: 1,
      turnStartTime: Date.now(),
      status: 'active',
      startTime: Date.now(),
      winner: null,
      isAIMatch: true
    };

    this.activeMatches.set(matchId, matchState);

    // Schedule AI turn if AI goes first
    if (firstPlayerId === aiCharacter.id) {
      setTimeout(() => this.processAITurnIfNeeded(matchId), 2000);
    }

    return {
      matchId,
      initialState: this.getPublicMatchState(matchState)
    };
  }

  /**
   * Create a new match between two players
   * @param {Object} player1 - Player 1 data with socket and character
   * @param {Object} player2 - Player 2 data with socket and character
   * @returns {Object} - Match data
   */
  createMatch(player1, player2) {
    const matchId = uuidv4();

    // Determine who goes first based on speed
    const firstPlayerId = combatService.determineTurnOrder(
      player1.character,
      player2.character
    );

    const matchState = {
      matchId,
      player1: {
        userId: player1.userId,
        socket: player1.socket,
        character: player1.character,
        currentHealth: player1.character.max_health,
        maxHealth: player1.character.max_health,
        attack: player1.character.attack,
        defense: player1.character.defense,
        speed: player1.character.speed,
        isDefending: false,
        totalDamageDealt: 0
      },
      player2: {
        userId: player2.userId,
        socket: player2.socket,
        character: player2.character,
        currentHealth: player2.character.max_health,
        maxHealth: player2.character.max_health,
        attack: player2.character.attack,
        defense: player2.character.defense,
        speed: player2.character.speed,
        isDefending: false,
        totalDamageDealt: 0
      },
      currentTurn: firstPlayerId,
      turnNumber: 1,
      turnStartTime: Date.now(),
      status: 'active',
      startTime: Date.now(),
      winner: null
    };

    this.activeMatches.set(matchId, matchState);

    return {
      matchId,
      initialState: this.getPublicMatchState(matchState)
    };
  }

  /**
   * Process a player action
   * @param {string} matchId - Match ID
   * @param {string} userId - User ID of acting player
   * @param {string} action - Action: 'attack', 'defend', 'special'
   * @returns {Object} - Action result
   */
  async processAction(matchId, userId, action) {
    const match = this.activeMatches.get(matchId);

    if (!match) {
      throw new Error('Match not found');
    }

    if (match.status !== 'active') {
      throw new Error('Match is not active');
    }

    // Validate action
    if (!combatService.isValidAction(action)) {
      throw new Error('Invalid action');
    }

    // Determine attacker and defender
    const isPlayer1 = match.player1.userId === userId;
    const attacker = isPlayer1 ? match.player1 : match.player2;
    const defender = isPlayer1 ? match.player2 : match.player1;

    // Verify it's the attacker's turn
    if (match.currentTurn !== attacker.character.id) {
      throw new Error('Not your turn');
    }

    // Reset defending state
    attacker.isDefending = false;

    // Handle action
    let actionResult = {};

    if (action === 'defend') {
      // Defender doubles defense this turn
      attacker.isDefending = true;
      actionResult = {
        action: 'defend',
        damage: 0,
        isCritical: false,
        missed: false
      };
    } else {
      // Calculate damage
      const damageResult = combatService.calculateDamage(attacker, defender, action);

      // Apply damage
      defender.currentHealth = Math.max(0, defender.currentHealth - damageResult.damage);
      attacker.totalDamageDealt += damageResult.damage;

      actionResult = {
        action,
        ...damageResult
      };
    }

    // Reset defender's defending state for next turn
    defender.isDefending = false;

    // Check if match is over
    if (defender.currentHealth <= 0) {
      match.status = 'finished';
      match.winner = attacker.userId;
      match.endTime = Date.now();

      // Calculate rewards and save match (will be done in controller)
      const matchResult = await this.finalizeMatch(match);

      return {
        ...actionResult,
        finished: true,
        matchResult,
        state: this.getPublicMatchState(match) // Include final state
      };
    }

    // Switch turn
    match.currentTurn = defender.character.id;
    match.turnNumber++;
    match.turnStartTime = Date.now();

    // Schedule AI turn if it's AI's turn now
    console.log(`After human action: defender userId=${defender.userId}, defender.character.isAI=${defender.character.isAI}, match is AI match=${match.isAIMatch}`);
    if (match.isAIMatch && (defender.userId === 'ai' || defender.character.isAI)) {
      console.log('Scheduling AI response turn');
      setTimeout(() => this.processAITurnIfNeeded(matchId), 1500);
    } else {
      console.log('Not scheduling AI turn - not AI defender or not AI match');
    }

    return {
      ...actionResult,
      finished: false,
      state: this.getPublicMatchState(match)
    };
  }

  /**
   * Finalize match and calculate rewards
   * @param {Object} match - Match state
   * @returns {Object} - Match results with rewards
   */
  async finalizeMatch(match) {
    const winner = match.player1.userId === match.winner ? match.player1 : match.player2;
    const loser = match.player1.userId === match.winner ? match.player2 : match.player1;

    // Calculate rewards based on level difference
    // Beat higher level = more rewards, beat lower level = less rewards
    const xpReward = combatService.calculateXPReward(
      winner.character.level,
      loser.character.level
    );

    const coinReward = combatService.calculateCoinReward(
      winner.character.level,
      loser.character.level
    );

    // Calculate ELO changes
    const winnerEloChange = combatService.calculateEloChange(
      winner.character.elo_rating,
      loser.character.elo_rating,
      true
    );

    const loserEloChange = combatService.calculateEloChange(
      loser.character.elo_rating,
      winner.character.elo_rating,
      false
    );

    const duration = Math.floor((match.endTime - match.startTime) / 1000);

    return {
      winnerId: winner.userId,
      loserId: loser.userId,
      winnerCharacterId: winner.character.id,
      loserCharacterId: loser.character.id,
      rewards: {
        xp: xpReward,
        coins: coinReward,
        eloChange: winnerEloChange
      },
      loserEloChange,
      duration,
      player1DamageDealt: match.player1.totalDamageDealt,
      player2DamageDealt: match.player2.totalDamageDealt,
      turns: match.turnNumber
    };
  }

  /**
   * Handle player surrender
   * @param {string} matchId - Match ID
   * @param {string} userId - User ID of surrendering player
   * @returns {Object} - Match result
   */
  async surrender(matchId, userId) {
    const match = this.activeMatches.get(matchId);

    if (!match) {
      throw new Error('Match not found');
    }

    // Determine winner (the other player)
    match.winner = match.player1.userId === userId ? match.player2.userId : match.player1.userId;
    match.status = 'finished';
    match.endTime = Date.now();

    // Set loser's health to 0
    if (match.player1.userId === userId) {
      match.player1.currentHealth = 0;
    } else {
      match.player2.currentHealth = 0;
    }

    const matchResult = await this.finalizeMatch(match);

    return {
      ...matchResult,
      surrendered: true
    };
  }

  /**
   * Handle player disconnect
   * @param {string} userId - User ID of disconnected player
   * @returns {Array} - Match IDs affected
   */
  handleDisconnect(userId) {
    const affectedMatches = [];

    for (const [matchId, match] of this.activeMatches.entries()) {
      if (match.player1.userId === userId || match.player2.userId === userId) {
        affectedMatches.push(matchId);

        // Auto-loss for disconnected player
        match.winner = match.player1.userId === userId ? match.player2.userId : match.player1.userId;
        match.status = 'disconnected';
        match.endTime = Date.now();
      }
    }

    return affectedMatches;
  }

  /**
   * Get public match state (remove sensitive data)
   * @param {Object} match - Full match state
   * @returns {Object} - Public match state
   */
  getPublicMatchState(match) {
    return {
      matchId: match.matchId,
      player1: {
        userId: match.player1.userId,
        username: match.player1.character.name,
        currentHealth: match.player1.currentHealth,
        maxHealth: match.player1.maxHealth,
        level: match.player1.character.level,
        isDefending: match.player1.isDefending,
        selectedCharacter: match.player1.character.selected_character || 'pink'
      },
      player2: {
        userId: match.player2.userId,
        username: match.player2.character.name,
        currentHealth: match.player2.currentHealth,
        maxHealth: match.player2.maxHealth,
        level: match.player2.character.level,
        isDefending: match.player2.isDefending,
        selectedCharacter: match.player2.character.selected_character || 'owlet'
      },
      currentTurn: match.currentTurn,
      turnNumber: match.turnNumber,
      status: match.status
    };
  }

  /**
   * Get match by ID
   * @param {string} matchId - Match ID
   * @returns {Object|null} - Match state or null
   */
  getMatch(matchId) {
    return this.activeMatches.get(matchId);
  }

  /**
   * Remove finished match
   * @param {string} matchId - Match ID
   */
  removeMatch(matchId) {
    this.activeMatches.delete(matchId);
  }

  /**
   * Get active match for user
   * @param {string} userId - User ID
   * @returns {Object|null} - Match state or null
   */
  getUserMatch(userId) {
    for (const [matchId, match] of this.activeMatches.entries()) {
      if (match.player1.userId === userId || match.player2.userId === userId) {
        return match;
      }
    }
    return null;
  }

  /**
   * Process AI turn if needed
   * @param {string} matchId - Match ID
   */
  async processAITurnIfNeeded(matchId) {
    try {
      console.log(`Processing AI turn for match: ${matchId}`);
      const match = this.activeMatches.get(matchId);
      if (!match || match.status !== 'active' || !match.isAIMatch) {
        console.log(`Match not valid: exists=${!!match}, status=${match?.status}, isAI=${match?.isAIMatch}`);
        return;
      }

      // Determine which player is AI - check both userId and isAI flag
      const aiPlayer = (match.player2.userId === 'ai' || match.player2.character.isAI) ? match.player2 : 
                      ((match.player1.userId === 'ai' || match.player1.character.isAI) ? match.player1 : null);
      const humanPlayer = (match.player2.userId === 'ai' || match.player2.character.isAI) ? match.player1 : match.player2;

      console.log(`AI player found: ${!!aiPlayer}, Current turn: ${match.currentTurn}, AI ID: ${aiPlayer?.character.id}`);

      if (!aiPlayer || match.currentTurn !== aiPlayer.character.id) {
        console.log('Not AI turn or no AI found - skipping');
        return; // Not AI's turn or no AI found
      }

      console.log('Making AI decision...');
      // Make AI decision
      const action = await aiOpponentService.makeDecision(aiPlayer, humanPlayer, match);
      console.log(`AI chose action: ${action}`);

      // Process the AI action
      const result = await this.processAction(matchId, aiPlayer.userId, action);
      console.log(`AI action processed, finished: ${result.finished}`);

      // Broadcast result to human player - check for valid socket
      if (humanPlayer && humanPlayer.socket && typeof humanPlayer.socket.emit === 'function') {
        const updatedMatchState = this.getPublicMatchState(match);
        
        // Emit both AI-specific event and general game state update
        humanPlayer.socket.emit('ai_action', {
          action,
          result,
          aiName: aiPlayer.character.name,
          matchState: updatedMatchState
        });
        
        // Also emit the standard game state update that the frontend expects
        humanPlayer.socket.emit('game:state', updatedMatchState);
        
        // Emit turn update
        humanPlayer.socket.emit('game:turn', {
          isYourTurn: match.currentTurn === humanPlayer.character.id
        });
        
        console.log('AI action and game state broadcasted to human player');
      } else {
        console.log('No valid socket found for human player in AI match:', matchId);
      }

    } catch (error) {
      console.error('Error processing AI turn:', error);
    }
  }
}

module.exports = new GameService();
