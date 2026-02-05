/**
 * CharacterStats - Stats display and upgrade section
 */

import React from 'react';

const STAT_INFO = {
  attack: { icon: '⚔️', color: 'text-game-red', bg: 'bg-game-red', increase: 5, baseCost: 100, cap: null },
  defense: { icon: '🛡️', color: 'text-game-blue', bg: 'bg-game-blue', increase: 3, baseCost: 100, cap: null },
  max_health: { icon: '❤️', color: 'text-game-green', bg: 'bg-game-green', increase: 20, baseCost: 150, cap: null },
  critical: { icon: '💥', color: 'text-red-400', bg: 'bg-red-400', increase: 2, baseCost: 200, cap: 40, unit: '%' },
  luck: { icon: '🍀', color: 'text-game-purple', bg: 'bg-game-purple', increase: 2, baseCost: 200, cap: 48, unit: '%' }
};

const CharacterStats = ({ character, onUpgrade, upgrading }) => {
  const calculateUpgradeCost = (stat) => {
    const baseCost = STAT_INFO[stat]?.baseCost || 100;
    return Math.floor(baseCost * (1 + character.level * 0.1));
  };

  const getEffectivePercentage = (stat, value) => {
    if (!['critical', 'luck'].includes(stat)) return null;
    const levelPenalty = (character.level - 1) * 2;
    const effective = Math.max(1, value - levelPenalty);
    return Math.min(effective, STAT_INFO[stat].cap);
  };

  return (
    <div className="bg-game-panel rounded-lg p-5 mb-5">
      <h2 className="text-game-accent mb-5 border-b-2 border-game-accent pb-2">Upgrade Stats</h2>

      {character.stat_points > 0 && (
        <div className="bg-game-gold/20 border-2 border-game-gold rounded-lg p-4 text-center mb-5 text-game-gold font-bold">
          ✨ You have {character.stat_points} free stat point{character.stat_points > 1 ? 's' : ''} to spend!
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
        {Object.entries(STAT_INFO).map(([stat, info]) => {
          const cost = calculateUpgradeCost(stat);
          const canAfford = character.coins >= cost;
          const hasFreePoints = (character.stat_points || 0) > 0;
          const currentValue = character.baseStats[stat] || 0;
          const isAtCap = info.cap && currentValue >= info.cap;
          const effectiveValue = getEffectivePercentage(stat, currentValue);
          const displayValue = effectiveValue !== null ? effectiveValue : currentValue;

          return (
            <div key={stat} className="bg-game-card rounded-lg p-5 text-center">
              <div className="mb-2">
                <span className="text-2xl mr-2">{info.icon}</span>
                <span className="text-sm text-gray-400">{stat.replace('_', ' ').toUpperCase()}</span>
              </div>

              <div className={`text-4xl font-bold mb-1 flex items-center justify-center gap-2 ${info.color}`}>
                {displayValue}{info.unit || ''}
                {isAtCap && <span className="text-xs bg-game-green px-2 py-0.5 rounded-full ml-1">MAX</span>}
              </div>

              {effectiveValue !== null && (
                <div className="text-xs text-game-orange mb-1">Base: {currentValue}% (scaled by level)</div>
              )}

              <div className="text-xs text-gray-500 mb-4">
                +{info.increase}{info.unit || ''} per upgrade
                {info.cap && <span className="text-gray-600"> (max {info.cap}%)</span>}
              </div>

              <div className="flex gap-2 mt-2">
                {hasFreePoints && !isAtCap && (
                  <button
                    onClick={() => onUpgrade(stat, true)}
                    disabled={upgrading || isAtCap}
                    className="flex-1 p-2 border-none rounded text-white font-bold font-mono text-sm cursor-pointer bg-game-gold hover:brightness-110 disabled:opacity-50"
                  >
                    {upgrading ? '...' : '✨ Free'}
                  </button>
                )}

                <button
                  onClick={() => onUpgrade(stat, false)}
                  disabled={!canAfford || upgrading || isAtCap}
                  className={`p-2 border-none rounded text-white font-bold font-mono text-sm
                    ${hasFreePoints && !isAtCap ? 'flex-1' : 'w-full'}
                    ${isAtCap ? 'bg-gray-600 cursor-not-allowed' : canAfford ? `${info.bg} cursor-pointer hover:brightness-110` : 'bg-gray-600 cursor-not-allowed opacity-50'}`}
                >
                  {upgrading ? '...' : isAtCap ? 'MAXED' : `${cost} 💰`}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CharacterStats;
