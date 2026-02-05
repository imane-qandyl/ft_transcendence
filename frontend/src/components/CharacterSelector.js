/**
 * CharacterSelector - Sprite/class selection grid
 */

import React from 'react';
import { CHARACTER_SPRITES } from '../constants/characters';

const UNLOCK_LEVEL = 20;

const CharacterSelector = ({ character, onSelectSprite, onMessage }) => {
  return (
    <div className="bg-game-panel rounded-lg p-5 mb-5">
      <h2 className="text-game-accent mb-5 border-b-2 border-game-accent pb-2">Your Character Class</h2>

      {character.level < UNLOCK_LEVEL ? (
        <div className="bg-game-red/20 border-2 border-game-red rounded-lg p-4 text-center mb-5 text-game-red font-bold">
          🔒 Character change locked until Level {UNLOCK_LEVEL}
          <div className="text-xs mt-2 text-gray-400">
            Progress: Level {character.level} / {UNLOCK_LEVEL} ({Math.floor((character.level / UNLOCK_LEVEL) * 100)}%)
          </div>
        </div>
      ) : (
        <div className="bg-game-green/20 border-2 border-game-green rounded-lg p-4 text-center mb-5 text-game-green font-bold">
          🔓 Character change unlocked! You can now switch classes.
        </div>
      )}

      <div className="flex justify-center gap-4 flex-wrap max-w-4xl mx-auto">
        {CHARACTER_SPRITES.map(sprite => {
          const isCurrentCharacter = character.customization?.selected_character === sprite.id ||
                                     character.sprite_body === sprite.id;
          const isLocked = character.level < UNLOCK_LEVEL && !isCurrentCharacter;

          return (
            <div
              key={sprite.id}
              onClick={() => {
                if (!isLocked) {
                  onSelectSprite(sprite.id);
                } else {
                  onMessage(`🔒 Reach level ${UNLOCK_LEVEL} to unlock character switching!`);
                }
              }}
              className={`w-32 p-4 rounded-lg border-3 text-center transition-all
                ${isCurrentCharacter ? 'border-current' : 'border-gray-700'}
                ${isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:brightness-110'}`}
              style={{
                borderColor: isCurrentCharacter ? sprite.color : undefined,
                backgroundColor: isCurrentCharacter ? `${sprite.color}22` : '#1a1a2e',
              }}
            >
              <div
                className="mx-auto mb-2 flex items-center justify-center overflow-hidden bg-game-bg rounded-lg"
                style={{
                  width: sprite.size === 'large' ? '90px' : '80px',
                  height: sprite.size === 'large' ? '90px' : '80px'
                }}
              >
                <div
                  className="[image-rendering:pixelated]"
                  style={{
                    backgroundImage: `url(${sprite.sprite})`,
                    backgroundSize: sprite.size === 'large' ? '384px 96px' : '128px 32px',
                    backgroundPosition: '0 0',
                    width: sprite.size === 'large' ? '96px' : '32px',
                    height: sprite.size === 'large' ? '96px' : '32px',
                    transform: sprite.size === 'large' ? 'scale(0.85)' : 'scale(2)',
                  }}
                />
              </div>
              <span className="block text-sm mb-1">{sprite.name}</span>
              {isCurrentCharacter && (
                <span className="block text-game-accent text-xs font-bold">✓ Your Class</span>
              )}
              {isLocked && <span className="block text-base mt-1">🔒</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CharacterSelector;
