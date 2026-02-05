/**
 * CharacterSlots - Character slots management and selection
 */

import React from 'react';
import { CHARACTER_SPRITES } from '../constants/characters';

const CharacterSlots = ({ allCharacters, slotsInfo, onSwitch, onCreateNew }) => {
  if (allCharacters.length === 0) return null;

  return (
    <div className="bg-game-panel rounded-lg p-5 mb-5">
      <h3 className="text-game-accent mb-4 flex items-center gap-4 text-lg">
        Character Slots ({slotsInfo.used}/{slotsInfo.max})
        {slotsInfo.nextUnlockLevel && (
          <span className="text-xs text-gray-500 font-normal">
            Next slot at Level {slotsInfo.nextUnlockLevel}
          </span>
        )}
      </h3>

      <div className="flex gap-4 flex-wrap">
        {allCharacters.map((char) => {
          const spriteInfo = CHARACTER_SPRITES.find(s => s.id === char.class) || CHARACTER_SPRITES[0];
          return (
            <div
              key={char.id}
              onClick={() => !char.isActive && onSwitch(char.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 min-w-[200px] relative transition-all
                ${char.isActive ? 'border-game-accent bg-game-accent/20 cursor-default' : 'border-gray-700 bg-game-card cursor-pointer hover:border-gray-500'}`}
            >
              <div className="w-12 h-12 flex items-center justify-center overflow-hidden bg-game-bg rounded-lg">
                <div
                  className="[image-rendering:pixelated]"
                  style={{
                    backgroundImage: `url(${spriteInfo.sprite})`,
                    backgroundSize: spriteInfo.size === 'large' ? '384px 96px' : '128px 32px',
                    backgroundPosition: '0 0',
                    width: spriteInfo.size === 'large' ? '96px' : '32px',
                    height: spriteInfo.size === 'large' ? '96px' : '32px',
                    transform: spriteInfo.size === 'large' ? 'scale(0.5)' : 'scale(1.5)',
                  }}
                />
              </div>
              <div className="flex-1">
                <div className="font-bold text-sm mb-0.5">{char.name}</div>
                <div className="text-xs text-gray-500">Lvl {char.level} {spriteInfo.name}</div>
                <div className="text-xs text-game-purple">🏆 {char.elo_rating}</div>
              </div>
              {char.isActive && (
                <span className="absolute -top-2 right-2 bg-game-accent text-black text-[10px] font-bold px-2 py-0.5 rounded-full">
                  ACTIVE
                </span>
              )}
            </div>
          );
        })}

        {/* Empty slot / Add new character button */}
        {slotsInfo.used < slotsInfo.max && (
          <div
            onClick={onCreateNew}
            className="flex flex-col items-center justify-center gap-1 px-4 py-3 rounded-lg border-2 border-dashed border-game-accent bg-transparent min-w-[200px] min-h-[80px] cursor-pointer hover:bg-game-accent/10 transition-all"
          >
            <div className="text-3xl text-game-accent">+</div>
            <div className="text-xs text-game-accent">Create New Character</div>
          </div>
        )}

        {/* Locked slot preview */}
        {slotsInfo.used >= slotsInfo.max && slotsInfo.nextUnlockLevel && (
          <div className="flex flex-col items-center justify-center gap-1 px-4 py-3 rounded-lg border-2 border-dashed border-gray-600 bg-game-card/50 min-w-[200px] min-h-[80px] opacity-60 cursor-not-allowed">
            <div className="text-2xl">🔒</div>
            <div className="text-xs text-gray-500">Unlock at Level {slotsInfo.nextUnlockLevel}</div>
            <div className="text-[10px] text-gray-600">{slotsInfo.highestLevel}/{slotsInfo.nextUnlockLevel}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CharacterSlots;
