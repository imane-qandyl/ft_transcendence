/**
 * Game Socket Handler - Street Pixel Wars
 * Handles all real-time game events via Socket.io
 */

const matchmakingService = require('../services/matchmakingService');
const gameService = require('../services/gameService');
const knex = require('../db');

class GameSocketHandler {
  constructor(io) {
    this.io = io;
  }

  /**
   * Handle matchmaking queue join
   */
  async handleJoinQueue(socket, data) {
    try {
      const userId = socket.user.id;

      // Get user's character from database
      let character = await knex('characters')
        .where('characters.user_id', userId)
        .select('characters.*')
        .first();

      // Auto-create character if it doesn't exist
      if (!character) {
        const user = await knex('users').where('id', userId).first();
        const username = user?.username || `Player${userId}`;
        
        await knex('characters').insert({
          user_id: userId,
          name: username,
          level: 1,
          experience: 0,
          coins: 1000,
          max_health: 100,
          attack: 20,
          defense: 10,
          speed: 15,
          critical: 10, // 10% base critical
          luck: 5, // 5% base luck
          stat_points: 0,
          elo_rating: 1000,
          wins: 0,
          losses: 0,
          sprite_body: 'body_base',
          sprite_hair: 'hair_short',
          sprite_outfit: 'outfit_basic',
          selected_character: 'pink'
        });
        
        character = await knex('characters')
          .where('characters.user_id', userId)
          .select('characters.*')
          .first();
      }
      
      // Get username from users table
      const user = await knex('users').where('id', userId).first();
      character.username = user?.username || character.name;

      // Get equipped items for stat calculation
      const equipment = await knex('character_equipment')
        .join('items', 'character_equipment.item_id', 'items.id')
        .where('character_equipment.character_id', character.id)
        .select('items.*');

      // Calculate total stats with equipment
      const combatService = require('../services/combatService');
      const totalStats = combatService.calculateTotalStats(character, equipment);

      // Update character with total stats for combat
      Object.assign(character, totalStats);

      // Join matchmaking queue
      const result = await matchmakingService.joinQueue(userId, socket, character);

      if (result.matched) {
        // Match found! Create the game
        const match = gameService.createMatch(result.player1, result.player2);

        // Join both players to the match room
        result.player1.socket.join(match.matchId);
        result.player2.socket.join(match.matchId);

        // Notify player 1
        result.player1.socket.emit('game:start', {
          matchId: match.matchId,
          initialState: match.initialState,
          myCharacterId: result.player1.character.id,
          myUserId: result.player1.userId,
          isYourTurn: match.initialState.currentTurn === result.player1.character.id,
          opponent: {
            username: result.player2.character.name,
            level: result.player2.character.level
          }
        });

        // Notify player 2
        result.player2.socket.emit('game:start', {
          matchId: match.matchId,
          initialState: match.initialState,
          myCharacterId: result.player2.character.id,
          myUserId: result.player2.userId,
          isYourTurn: match.initialState.currentTurn === result.player2.character.id,
          opponent: {
            username: result.player1.character.name,
            level: result.player1.character.level
          }
        });

      } else if (result.error) {
        socket.emit('error', { message: result.error });
      } else {
        // Added to queue
        socket.emit('matchmaking:joined', {
          queuePosition: result.queuePosition
        });
      }

    } catch (error) {
      console.error('Join queue error:', error);
      socket.emit('error', { message: 'Failed to join matchmaking queue' });
    }
  }

  /**
   * Handle leaving matchmaking queue
   */
  handleLeaveQueue(socket) {
    const userId = socket.user.id;
    const removed = matchmakingService.leaveQueue(userId);

    socket.emit('matchmaking:left', { success: removed });
  }

  /**
   * Handle game action (attack, defend, special)
   */
  async handleGameAction(socket, data) {
    try {
      const userId = socket.user.id;
      const { matchId, action } = data;

      // Validate
      if (!matchId || !action) {
        socket.emit('error', { message: 'Invalid action data' });
        return;
      }

      // Process action
      const result = await gameService.processAction(matchId, userId, action);

      // Get health from result.state (which is always available now)
      const player1Health = result.state ? result.state.player1.currentHealth : 0;
      const player2Health = result.state ? result.state.player2.currentHealth : 0;
      
      // Broadcast action result to both players with updated health
      this.io.to(matchId).emit('game:action:result', {
        action: result.action,
        damage: result.damage,
        isCritical: result.isCritical,
        missed: result.missed,
        luckyDodge: result.luckyDodge || false, // Defender dodged due to luck
        player1Health,
        player2Health
      });

      if (result.finished) {
        // Game over! Send final state first
        if (result.state) {
          this.io.to(matchId).emit('game:state', result.state);
        }
        // Then handle match end
        await this.handleMatchEnd(matchId, result.matchResult);
      } else {
        // Update game state
        this.io.to(matchId).emit('game:state', result.state);

        // Notify whose turn it is
        const match = gameService.getMatch(matchId);
        if (match) {
          match.player1.socket.emit('game:turn', {
            isYourTurn: match.currentTurn === match.player1.character.id
          });
          match.player2.socket.emit('game:turn', {
            isYourTurn: match.currentTurn === match.player2.character.id
          });
        }
      }

    } catch (error) {
      console.error('Game action error:', error);
      socket.emit('error', { message: error.message || 'Failed to process action' });
    }
  }

  /**
   * Handle player surrender
   */
  async handleSurrender(socket, data) {
    try {
      const userId = socket.user.id;
      const { matchId } = data;

      const result = await gameService.surrender(matchId, userId);

      await this.handleMatchEnd(matchId, result);

    } catch (error) {
      console.error('Surrender error:', error);
      socket.emit('error', { message: 'Failed to surrender' });
    }
  }

  /**
   * Handle match end - save to database and notify players
   */
  async handleMatchEnd(matchId, matchResult) {
    try {
      // Save match to database (use game_matches table which has the right columns)
      const [match] = await knex('game_matches').insert({
        player1_id: matchResult.winnerCharacterId,
        player2_id: matchResult.loserCharacterId,
        winner_id: matchResult.winnerCharacterId,
        match_type: 'ranked',
        duration_seconds: matchResult.duration,
        player1_damage_dealt: matchResult.player1DamageDealt,
        player2_damage_dealt: matchResult.player2DamageDealt,
        player1_elo_change: matchResult.rewards.eloChange,
        player2_elo_change: matchResult.loserEloChange,
        winner_xp: matchResult.rewards.xp,
        winner_coins: matchResult.rewards.coins
      }).returning('*');

      // Update winner's character
      await knex('characters')
        .where('id', matchResult.winnerCharacterId)
        .increment({
          wins: 1,
          experience: matchResult.rewards.xp,
          coins: matchResult.rewards.coins,
          elo_rating: matchResult.rewards.eloChange
        });

      // Update loser's character
      await knex('characters')
        .where('id', matchResult.loserCharacterId)
        .increment({
          losses: 1,
          elo_rating: matchResult.loserEloChange
        });

      // Check for level up
      const winner = await knex('characters')
        .where('id', matchResult.winnerCharacterId)
        .first();

      const combatService = require('../services/combatService');
      const levelUp = combatService.checkLevelUp(winner);

      if (levelUp) {
        await knex('characters')
          .where('id', matchResult.winnerCharacterId)
          .update({
            level: levelUp.newLevel,
            experience: levelUp.remainingXP,
            max_health: knex.raw('max_health + ?', [levelUp.statIncrease.max_health]),
            attack: knex.raw('attack + ?', [levelUp.statIncrease.attack]),
            defense: knex.raw('defense + ?', [levelUp.statIncrease.defense]),
            speed: knex.raw('speed + ?', [levelUp.statIncrease.speed]),
            stat_points: knex.raw('COALESCE(stat_points, 0) + ?', [levelUp.statPointsGranted || 3]) // Grant 3 stat points
          });
      }

      // Notify both players of match end
      this.io.to(matchId).emit('game:end', {
        winnerId: matchResult.winnerId,
        rewards: matchResult.rewards,
        loserEloChange: matchResult.loserEloChange,
        levelUp: levelUp || null,
        statPointsGranted: levelUp ? (levelUp.statPointsGranted || 3) : 0,
        duration: matchResult.duration,
        surrendered: matchResult.surrendered || false
      });

      // Clean up match
      gameService.removeMatch(matchId);

    } catch (error) {
      console.error('Match end error:', error);
    }
  }

  /**
   * Handle disconnection
   */
  async handleDisconnect(socket) {
    const userId = socket.user?.id;

    if (!userId) return;

    // Remove from matchmaking queue
    matchmakingService.leaveQueue(userId);

    // Handle active matches
    const affectedMatches = gameService.handleDisconnect(userId);

    for (const matchId of affectedMatches) {
      const match = gameService.getMatch(matchId);

      if (match) {
        // Notify opponent
        this.io.to(matchId).emit('game:end', {
          winnerId: match.winner,
          reason: 'opponent_disconnected',
          rewards: { xp: 50, coins: 100, eloChange: 10 }
        });

        // Save as disconnection loss
        // (simplified - you'd calculate proper rewards here)
        const result = await gameService.finalizeMatch(match);
        await this.handleMatchEnd(matchId, result);
      }
    }
  }

  /**
   * Initialize socket event handlers
   */
  initialize(socket) {
    // Matchmaking events
    socket.on('matchmaking:join', (data) => {
      this.handleJoinQueue(socket, data);
    });
    socket.on('matchmaking:leave', () => this.handleLeaveQueue(socket));

    // Game events
    socket.on('game:action', (data) => this.handleGameAction(socket, data));
    socket.on('game:surrender', (data) => this.handleSurrender(socket, data));

    // Disconnection
    socket.on('disconnect', () => this.handleDisconnect(socket));
  }
}

module.exports = GameSocketHandler;
