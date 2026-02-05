/**
 * GameCanvas Component
 * React wrapper for Phaser game
 */

import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { gameConfig } from '../game/config';

export function GameCanvas({ socket, matchId, initialState, myCharacterId, myUserId, isYourTurn, onGameEnd }) {
  const gameRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!socket || !matchId || !initialState) {
      return;
    }

    // Store battle data globally so scenes can access it
    window.__BATTLE_DATA__ = {
      socket,
      matchId,
      initialState,
      myCharacterId,
      myUserId,
      isYourTurn
    };

    // Create Phaser game instance
    const config = {
      ...gameConfig,
      parent: containerRef.current
    };

    gameRef.current = new Phaser.Game(config);
    // BootScene will start automatically and chain to PreloadScene -> BattleScene

    // Listen for game end event
    const handleGameEnd = (event) => {
      if (onGameEnd) {
        onGameEnd(event.detail);
      }
    };

    window.addEventListener('gameEnd', handleGameEnd);

    // Cleanup
    return () => {
      window.removeEventListener('gameEnd', handleGameEnd);
      delete window.__BATTLE_DATA__;

      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [socket, matchId, initialState, onGameEnd]);

  return (
    <div className="game-canvas-wrapper" style={styles.wrapper}>
      <div ref={containerRef} id="game-container" style={styles.container}></div>
    </div>
  );
}

const styles = {
  wrapper: {
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0f1a'
  },
  container: {
    width: '100%',
    height: '100%',
    maxWidth: '100vw',
    maxHeight: '100vh'
  }
};

export default GameCanvas;
