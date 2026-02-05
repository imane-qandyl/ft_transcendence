/**
 * Matchmaking Service - Street Pixel Wars
 * Handles player queue and opponent matching based on ELO
 */

class MatchmakingService {
  constructor() {
    // Queue structure: Map<userId, {socket, character, elo, joinedAt}>
    this.queue = new Map();
    this.ELO_RANGE = 200; // Match players within ±200 ELO
  }

  /**
   * Add player to matchmaking queue
   * @param {string} userId - User ID
   * @param {Object} socket - Socket.io socket
   * @param {Object} character - Character data
   * @returns {Object} - Match result or queue position
   */
  async joinQueue(userId, socket, character) {
    // Check if already in queue
    if (this.queue.has(userId)) {
      return { matched: false, error: 'Already in queue' };
    }

    // Try to find a match
    const opponent = this.findOpponent(character.elo_rating);

    if (opponent) {
      // Match found!
      this.queue.delete(opponent.userId);

      return {
        matched: true,
        player1: { userId, socket, character },
        player2: opponent
      };
    }

    // No match found, add to queue
    this.queue.set(userId, {
      userId,
      socket,
      character,
      elo: character.elo_rating,
      joinedAt: Date.now()
    });

    return {
      matched: false,
      queuePosition: this.queue.size
    };
  }

  /**
   * Find suitable opponent in queue
   * @param {number} playerElo - Player's ELO rating
   * @returns {Object|null} - Opponent data or null
   */
  findOpponent(playerElo) {
    for (const [userId, entry] of this.queue.entries()) {
      const eloDiff = Math.abs(entry.elo - playerElo);

      if (eloDiff <= this.ELO_RANGE) {
        return entry;
      }
    }

    // Increase range for players waiting too long (30+ seconds)
    const expandedRange = this.ELO_RANGE * 2;
    for (const [userId, entry] of this.queue.entries()) {
      const waitTime = Date.now() - entry.joinedAt;
      if (waitTime > 30000) {
        const eloDiff = Math.abs(entry.elo - playerElo);
        if (eloDiff <= expandedRange) {
          return entry;
        }
      }
    }

    return null;
  }

  /**
   * Remove player from queue
   * @param {string} userId - User ID
   * @returns {boolean} - Whether player was in queue
   */
  leaveQueue(userId) {
    return this.queue.delete(userId);
  }

  /**
   * Get queue size
   * @returns {number} - Number of players in queue
   */
  getQueueSize() {
    return this.queue.size;
  }

  /**
   * Clear entire queue (for maintenance)
   */
  clearQueue() {
    this.queue.clear();
  }

  /**
   * Get player's position in queue
   * @param {string} userId - User ID
   * @returns {number|null} - Position or null if not in queue
   */
  getQueuePosition(userId) {
    if (!this.queue.has(userId)) {
      return null;
    }

    let position = 1;
    for (const [id, entry] of this.queue.entries()) {
      if (id === userId) {
        return position;
      }
      position++;
    }

    return null;
  }
}

module.exports = new MatchmakingService();
