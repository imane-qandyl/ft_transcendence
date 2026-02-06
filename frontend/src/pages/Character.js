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
      const response = await api.get('/api/v1/characters/me');
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
      const response = await api.get('/api/v1/characters/all');
      setAllCharacters(response.data.characters || []);
      setSlotsInfo(response.data.slots || { used: 0, max: 1, nextUnlockLevel: 20 });
    } catch (err) {
      console.error('Failed to fetch all characters:', err);
    }
  };

  const switchCharacter = async (characterId) => {
    try {
      await api.post(`/api/v1/characters/${characterId}/select`);
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
      const response = await api.post('/api/v1/characters/me/upgrade', { stat, useFreePoints });
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
      await api.patch('/api/v1/characters/me/select-sprite', { selectedCharacter: spriteId });
      setCharacter(prev => ({
        ...prev,
        customization: { ...prev.customization, selected_character: spriteId }
      }));
      setMessage(`SELECTED ${spriteId.toUpperCase()}!`);
    } catch (err) {
      setMessage(err.response?.data?.error || 'SELECTION FAILED');
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-retro-purple text-xs pixel-blink">LOADING...</div>
      </div>
    );
  }

  // Show create new character screen
  if (showCreateNew) {
    return (
      <div className="h-full p-4 overflow-auto">
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
      <div className="h-full p-4 overflow-auto">
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
    <div className="h-full p-4 sm:p-6 overflow-auto">
      {/* Header */}
      <div className="text-center mb-4 sm:mb-6">
        <h1 className="text-retro-purple text-lg sm:text-xl mb-2">{character.name?.toUpperCase()}</h1>
        <div className="text-pixel-light text-xs sm:text-sm">
          LV.{character.level} {currentSprite.name?.toUpperCase()}
        </div>
      </div>

      {/* Character Display */}
      <div className="pixel-card p-3 sm:p-4 mb-4">
        <div className="flex flex-col sm:flex-row items-center gap-4">{/* Sprite */}
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

          {/* Quick Stats */}
          <div className="flex-1 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-pixel-light">ELO:</span>
              <span className="text-retro-yellow">{character.elo_rating}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-pixel-light">W/L:</span>
              <span><span className="text-retro-green">{character.wins}</span>/<span className="text-retro-red">{character.losses}</span></span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-pixel-light">COINS:</span>
              <span className="text-retro-yellow">{character.coins}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-pixel-light">POINTS:</span>
              <span className="text-retro-purple">{character.stat_points || 0}</span>
            </div>
          </div>
        </div>

        {/* XP Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-[8px] text-pixel-light mb-1">
            <span>EXP</span>
            <span>{character.experience}/{getXPForNextLevel(character.level)}</span>
          </div>
          <div className="h-3 bg-pixel-black border-2 border-pixel-light">
            <div
              className="h-full bg-retro-yellow"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`pixel-card p-2 mb-4 text-center text-xs ${message.includes('FAILED') ? 'border-retro-red text-retro-red' : 'border-retro-green text-retro-green'}`}>
          {message}
        </div>
      )}

      {/* Stats */}
      <div className="pixel-card p-4 mb-4">
        <div className="text-retro-purple text-xs mb-3">-- STATS --</div>
        <div className="space-y-2">
          {Object.entries(character.baseStats || {}).map(([stat, value]) => {
            // Format stat names properly
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
          COST: 100 COINS OR 1 STAT POINT
        </div>
      </div>

      {/* Character Selection */}
      <div className="pixel-card p-4 mb-4">
        <div className="text-retro-purple text-xs mb-3">-- SELECT FIGHTER --</div>
        <div className="grid grid-cols-3 gap-3">
          {CHARACTER_SPRITES.filter(s => !s.locked || character.level >= (s.unlockLevel || 0)).map(sprite => (
            <button
              key={sprite.id}
              onClick={() => selectCharacterSprite(sprite.id)}
              className={`p-2 border-3 ${
                (character.customization?.selected_character || character.sprite_body) === sprite.id
                  ? 'border-retro-purple bg-retro-purple/20'
                  : 'border-pixel-light bg-pixel-black hover:border-retro-purple'
              }`}
            >
              <div className="w-12 h-12 mx-auto flex items-center justify-center overflow-hidden">
                <img
                  src={sprite.sprite}
                  alt={sprite.name}
                  className="[image-rendering:pixelated]"
                  style={{
                    width: sprite.size === 'large' ? '96px' : '32px',
                    height: sprite.size === 'large' ? '96px' : '32px',
                    objectFit: 'none',
                    objectPosition: '0 0',
                    transform: sprite.size === 'large' ? 'scale(0.5)' : 'scale(1.5)',
                  }}
                />
              </div>
              <div className="text-[8px] text-pixel-light mt-1 truncate text-center">{sprite.name?.toUpperCase()}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Character Slots */}
      {allCharacters.length > 0 && (
        <div className="pixel-card p-4 mb-4">
          <div className="text-retro-purple text-xs mb-3">-- SAVE SLOTS ({slotsInfo.used}/{slotsInfo.max}) --</div>
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
                  <span className="text-pixel-white text-xs">{char.name?.toUpperCase()}</span>
                  <span className="text-pixel-light text-[8px]">LV.{char.level}</span>
                </div>
              </button>
            ))}
            {slotsInfo.used < slotsInfo.max && (
              <button
                onClick={() => setShowCreateNew(true)}
                className="w-full p-2 border-3 border-pixel-light bg-pixel-black hover:border-retro-green text-retro-green text-xs"
              >
                + NEW CHARACTER
              </button>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-2">
        <button
          onClick={() => navigate('/play')}
          className="pixel-btn pixel-btn-primary flex-1 text-xs"
        >
          {'>'} PLAY {'<'}
        </button>
      </div>
    </div>
  );
};

export default Character;
