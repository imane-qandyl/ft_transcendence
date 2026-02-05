/**
 * MatchmakingPanel - Matchmaking queue UI
 */

import React from 'react';

const MatchmakingPanel = ({
  matchStatus,
  queuePosition,
  currentSpriteName,
  error,
  onFindMatch,
  onCancelQueue
}) => {
  return (
    <div className="mb-5 text-center">
      {error && (
        <div className="bg-game-red text-white p-4 rounded-lg mb-4 font-bold">
          {error}
        </div>
      )}

      {matchStatus === 'idle' && (
        <button
          onClick={onFindMatch}
          className="px-10 py-5 text-xl font-bold text-white bg-game-red border-none rounded-lg cursor-pointer font-mono w-full max-w-md transition-all shadow-lg hover:brightness-110"
        >
          ⚔️ FIND PVP MATCH as {currentSpriteName.toUpperCase()}
        </button>
      )}

      {matchStatus === 'queued' && (
        <div className="bg-game-card p-8 rounded-lg max-w-md mx-auto border-3 border-game-accent shadow-[0_0_20px_rgba(78,204,163,0.3)]">
          <div className="w-10 h-10 border-4 border-white/10 border-t-game-accent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xl font-bold text-game-accent mb-2 animate-pulse">
            ⚔️ SEARCHING FOR OPPONENT... ⚔️
          </p>
          <p className="text-sm text-gray-400 mb-4">
            Queue Position: {queuePosition || 1} • Waiting for another player...
          </p>
          <button
            onClick={onCancelQueue}
            className="px-8 py-2.5 text-base bg-game-red text-white border-none rounded cursor-pointer font-mono hover:brightness-110"
          >
            ❌ Cancel Search
          </button>
        </div>
      )}

      {matchStatus === 'matched' && (
        <div className="bg-game-green p-8 rounded-lg max-w-md mx-auto">
          <p className="text-3xl font-bold mb-2">MATCH FOUND!</p>
          <p>Starting battle...</p>
        </div>
      )}
    </div>
  );
};

export default MatchmakingPanel;
