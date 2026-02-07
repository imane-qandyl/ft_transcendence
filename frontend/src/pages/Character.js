/**
 * Character Page - Pixel art style stats and character management
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import CharacterCreate from '../components/CharacterCreate';
import { CHARACTER_SPRITES, getXPForNextLevel } from '../constants/characters';

const Character = () => {
  const [character, setCharacter] = useState(null);
  const [allCharacters, setAllCharacters] = useState([]);
  const [slotsInfo, setSlotsInfo] = useState({ used: 0, max: 1, nextUnlockLevel: 20 });
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [upgrading, setUpgrading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCharacter();
  }, []);

  const fetchCharacter = async () => {
    try {
      setLoading(true);
      const response = await api.get('characters/me');
      setCharacter(response.data.character);
      setError('');
      fetchAllCharacters();
    } catch (err) {
      if (err.response?.status === 404) fetchAllCharacters();
      else setError('Failed to load character');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllCharacters = async () => {
    try {
      const response = await api.get('characters/all');
      setAllCharacters(response.data.characters || []);
      setSlotsInfo(response.data.slots || { used: 0, max: 1, nextUnlockLevel: 20 });
    } catch (err) {
      console.error('Failed to fetch all characters:', err);
    }
  };

  const switchCharacter = async (characterId) => {
    try {
      await api.post(`characters/${characterId}/select`);
      setMessage('CHARACTER SWITCHED!');
      setShowCreateNew(false);
      fetchCharacter();
    } catch (err) {
      setError(err.response?.data?.error || 'FAILED TO SWITCH');
    }
  };

  const handleNewCharacterCreated = (data) => {
    setShowCreateNew(false);
    setCharacter(data.character);
    setMessage('NEW CHARACTER CREATED!');
    fetchAllCharacters();
  };

  const upgradeStat = async (stat, useFreePoints = false) => {
    try {
      setUpgrading(true);
      setMessage('');
      const response = await api.post('characters/me/upgrade', { stat, useFreePoints });
      setMessage(`${stat.toUpperCase()} +1!`);
      setCharacter(prev => ({
        ...prev,
        baseStats: { ...prev.baseStats, [stat]: response.data.newValue },
        coins: response.data.remainingCoins,
        stat_points: response.data.remainingStatPoints
      }));
    } catch (err) {
      setMessage(err.response?.data?.error || 'UPGRADE FAILED');
    } finally {
      setUpgrading(false);
    }
  };

  const selectCharacterSprite = async (spriteId) => {
    try {
      await api.patch('characters/me/select-sprite', { selectedCharacter: spriteId });
      setCharacter(prev => ({
        ...prev,
        customization: { ...prev.customization, selected_character: spriteId }
      }));
      setMessage(`SELECTED ${spriteId.toUpperCase()}!`);
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.requiredLevel) {
        const { currentLevel, requiredLevel } = err.response.data;
        setMessage(`LEVEL ${requiredLevel} REQUIRED! CURRENT: ${currentLevel}`);
      } else {
        setMessage(err.response?.data?.error || 'SELECTION FAILED');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="text-retro-purple text-xs pixel-blink">LOADING...</div>
      </div>
    );
  }

  // Show create new character screen
  if (showCreateNew) {
    return (
      <div className="min-h-full p-4 overflow-auto">
        <button
          onClick={() => setShowCreateNew(false)}
          className="pixel-btn text-xs mb-4"
        >
          {'<'} BACK
        </button>
        <div className="text-center text-retro-purple text-sm mb-4">
          NEW CHARACTER (SLOT {slotsInfo.used + 1})
        </div>
        <CharacterCreate onCharacterCreated={handleNewCharacterCreated} />
      </div>
    );
  }

  if (!character) {
    return (
      <div className="min-h-full p-4 overflow-auto">
        <CharacterCreate
          onCharacterCreated={data => {
            setCharacter(data.character);
            setMessage('CHARACTER CREATED!');
            fetchAllCharacters();
          }}
        />
      </div>
    );
  }

  const currentSprite = CHARACTER_SPRITES.find(s =>
    s.id === (character.customization?.selected_character || character.sprite_body)
  ) || CHARACTER_SPRITES[0];

  const xpPercent = Math.min(100, (character.experience / getXPForNextLevel(character.level)) * 100);

  return (
    <div className="min-h-full p-4 sm:p-6 overflow-auto pb-6">
      {/* Header */}
      <div className="text-center mb-4 sm:mb-6">
        <h1 className="text-retro-purple text-lg sm:text-xl mb-2">⚔️ FIGHTER SELECTION ⚔️</h1>
        <div className="text-pixel-light text-xs sm:text-sm">
          Current: {character.name?.toUpperCase()} (LV.{character.level} {currentSprite.name?.toUpperCase()})
        </div>
      </div>

      {/* Current Fighter */}
      <div className="pixel-card p-3 sm:p-4 mb-4">
        <h2 className="text-retro-green text-xs mb-3">-- CURRENT FIGHTER --</h2>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Sprite */}
          <div className="w-20 h-20 bg-pixel-black border-3 border-pixel-light flex items-center justify-center overflow-hidden shrink-0">
            <div
              className="[image-rendering:pixelated]"
              style={{
                backgroundImage: `url(${currentSprite.sprite})`,
                backgroundSize: currentSprite.size === 'large' ? '384px 96px' : '128px 32px',
                backgroundPosition: '0 0',
                width: currentSprite.size === 'large' ? '96px' : '32px',
                height: currentSprite.size === 'large' ? '96px' : '32px',
                transform: currentSprite.size === 'large' ? 'scale(0.8)' : 'scale(2)',
              }}
            />
          </div>

          {/* Battle Stats */}
          <div className="flex-1 space-y-1">
            <div className="text-pixel-white font-bold text-sm mb-2">{character.name?.toUpperCase()}</div>
            <div className="flex justify-between text-xs">
              <span className="text-pixel-light">BATTLE RATING:</span>
              <span className="text-retro-yellow">{character.elo_rating}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-pixel-light">RECORD:</span>
              <span><span className="text-retro-green">{character.wins}W</span>-<span className="text-retro-red">{character.losses}L</span></span>
            </div>
          </div>
        </div>

        {/* Quick Level Info */}
        <div className="border-t-2 border-pixel-light pt-3 mt-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-pixel-light">LEVEL {character.level}</span>
            <span className="text-retro-yellow">{character.coins} COINS</span>
          </div>
          <div className="w-full bg-pixel-black border-2 border-pixel-light h-3 relative">
            <div
              className="h-full bg-retro-green transition-all duration-300"
              style={{ width: `${xpPercent}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-[8px] text-pixel-white font-bold">
              {character.experience}/{getXPForNextLevel(character.level)} EXP
            </div>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`pixel-card p-2 mb-4 text-center text-xs ${message.includes('FAILED') ? 'border-retro-red text-retro-red' : 'border-retro-green text-retro-green'}`}>
          {message}
        </div>
      )}

      {/* Combat Stats */}
      <div className="pixel-card p-4 mb-4">
        <div className="text-retro-purple text-xs mb-3">-- COMBAT STATS --</div>
        <div className="space-y-2">
          {Object.entries(character.baseStats || {}).map(([stat, value]) => {
            const statNames = {
              max_health: 'HP',
              attack: 'ATK',
              defense: 'DEF',
              speed: 'SPD',
              critical: 'CRIT',
              luck: 'LUCK'
            };
            const displayName = statNames[stat] || stat.toUpperCase();
            return (
              <div key={stat} className="flex items-center justify-between">
                <span className="text-pixel-light text-xs uppercase w-12">{displayName}</span>
                <div className="flex-1 mx-2 h-2 bg-pixel-black border border-pixel-light">
                  <div
                    className="h-full bg-retro-purple"
                    style={{ width: `${Math.min(100, value)}%` }}
                  />
                </div>
                <span className="text-pixel-white text-xs w-8 text-right">{value}</span>
                <button
                  onClick={() => upgradeStat(stat, character.stat_points > 0)}
                  disabled={upgrading || (character.coins < 100 && !character.stat_points)}
                  className="ml-2 px-2 py-1 bg-retro-purple border-2 border-retro-purple text-pixel-black text-[8px] disabled:opacity-50"
                >
                  +
                </button>
              </div>
            );
          })}
        </div>
        <div className="text-pixel-mid text-[8px] mt-2 text-center">
          UPGRADE COST: 100 COINS OR 1 STAT POINT
        </div>
      </div>

      {/* Character Class Selection */}
      <div className="pixel-card p-4 mb-4">
        <div className="text-retro-purple text-xs mb-3">-- CHANGE FIGHTER CLASS --</div>
        <div className="grid grid-cols-3 gap-3">
          {CHARACTER_SPRITES.map(sprite => {
            const isUnlocked = character.level >= sprite.unlockLevel;
            const isCurrentCharacter = (character.customization?.selected_character || character.sprite_body) === sprite.id;
            
            return (
              <button
                key={sprite.id}
                onClick={() => isUnlocked && selectCharacterSprite(sprite.id)}
                disabled={!isUnlocked}
                className={`p-2 border-3 relative ${
                  isCurrentCharacter
                    ? 'border-retro-purple bg-retro-purple/20'
                    : isUnlocked
                      ? 'border-pixel-light bg-pixel-black hover:border-retro-purple'
                      : 'border-gray-600 bg-gray-900 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="w-20 h-20 mx-auto flex items-center justify-center overflow-hidden">
                  <div
                    className={`[image-rendering:pixelated] ${!isUnlocked ? 'filter grayscale brightness-50' : ''}`}
                    style={{
                      backgroundImage: `url(${sprite.sprite})`,
                      backgroundSize: sprite.size === 'large' ? '384px 96px' : '128px 32px',
                      backgroundPosition: '0 0',
                      backgroundRepeat: 'no-repeat',
                      width: sprite.size === 'large' ? '96px' : '32px',
                      height: sprite.size === 'large' ? '96px' : '32px',
                      transform: sprite.size === 'large' ? 'scale(0.8)' : 'scale(2)',
                    }}
                  />
                  {!isUnlocked && (
                    <div className="absolute top-1 right-1 text-xs">🔒</div>
                  )}
                </div>
              <div className="text-[8px] mt-1 truncate text-center">
                <div className={isUnlocked ? 'text-pixel-light' : 'text-gray-500'}>
                  {sprite.name?.toUpperCase()}
                </div>
                {!isUnlocked && (
                  <div className="text-retro-yellow text-[7px]">LV.{sprite.unlockLevel}</div>
                )}
                {isCurrentCharacter && (
                  <div className="text-retro-green text-[7px]">✓ ACTIVE</div>
                )}
              </div>
            </button>
            );
          })}
        </div>
      </div>

      {/* Character Management */}
      {allCharacters.length > 0 && (
        <div className="pixel-card p-4 mb-4">
          <div className="text-retro-purple text-xs mb-3">-- MY FIGHTERS ({slotsInfo.used}/{slotsInfo.max}) --</div>
          <div className="space-y-2">
            {allCharacters.map(char => (
              <button
                key={char.id}
                onClick={() => switchCharacter(char.id)}
                className={`w-full p-2 border-3 text-left ${
                  char.id === character.id
                    ? 'border-retro-purple bg-retro-purple/20'
                    : 'border-pixel-light bg-pixel-black hover:border-retro-purple'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-pixel-white text-xs">{char.name?.toUpperCase()}</span>
                    <span className="text-pixel-light text-[8px] ml-2">({char.class?.toUpperCase() || 'Unknown'})</span>
                  </div>
                  <div className="text-right">
                    <div className="text-pixel-light text-[8px]">LV.{char.level}</div>
                    <div className="text-retro-yellow text-[8px]">ELO {char.elo_rating}</div>
                  </div>
                </div>
              </button>
            ))}
            {slotsInfo.used < slotsInfo.max && (
              <button
                onClick={() => setShowCreateNew(true)}
                className="w-full p-2 border-3 border-pixel-light bg-pixel-black hover:border-retro-green text-retro-green text-xs"
              >
                + CREATE NEW FIGHTER
              </button>
            )}
          </div>
        </div>
      )}

      {/* Battle Entry */}
      <div className="mt-auto pt-4">
        <button
          onClick={() => navigate('/play')}
          className="pixel-btn pixel-btn-primary w-full text-lg py-6 hover:shadow-pixel transition-all duration-200 mb-4"
        >
          <div className="flex items-center justify-center space-x-3">
            <span className="text-xl">⚔️</span>
            <span className="font-bold">ENTER BATTLE ARENA</span>
            <span className="text-xl">⚔️</span>
          </div>
          <div className="text-xs mt-1 opacity-75">Fight other players in ranked matches</div>
        </button>
        
        <div className="text-center">
          <button
            onClick={() => navigate('/profile')}
            className="text-pixel-light text-xs hover:text-retro-purple underline"
          >
            View Full Profile →
          </button>
        </div>
      </div>
    </div>
  );
};

export default Character;
