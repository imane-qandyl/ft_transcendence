/**
 * Play Page - Enhanced pixel art style game hub with improved UI/UX
 */

import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import api from '../services/api';
import GameCanvas from '../components/GameCanvas';
import { CHARACTER_SPRITES } from '../constants/characters';

const Play = () => {
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [matchStatus, setMatchStatus] = useState('idle');
  const [matchData, setMatchData] = useState(null);
  const [queueTime, setQueueTime] = useState(0);
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');

  useEffect(() => {
    fetchCharacter();
    setupSocket();
    return () => socket?.close();
  }, []);

  useEffect(() => {
    let interval;
    if (matchStatus === 'queued') {
      interval = setInterval(() => setQueueTime(t => t + 1), 1000);
    } else {
      setQueueTime(0);
    }
    return () => clearInterval(interval);
  }, [matchStatus]);

  const setupSocket = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No token found, skipping socket connection');
      return;
    }

    const newSocket = io(process.env.REACT_APP_WS_URL || 'http://localhost:3000', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    newSocket.on('connect', () => {
      // Socket connected successfully
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket.io connection error:', error.message);
      if (error.message.includes('Authentication')) {
        console.warn('Authentication failed, redirecting to login...');
        // You might want to redirect to login or refresh token here
      }
    });

    newSocket.on('disconnect', (reason) => {
      console.warn('Socket.io disconnected:', reason);
    });

    newSocket.on('matchmaking:joined', () => setMatchStatus('queued'));
    newSocket.on('matchmaking:left', () => setMatchStatus('idle'));
    newSocket.on('ai:error', (data) => {
      console.error('AI match error:', data.message);
      setMatchStatus('idle');
    });
    newSocket.on('game:start', (data) => {
      setMatchStatus('matched');
      setTimeout(() => {
        setMatchData(data);
        setMatchStatus('playing');
      }, 1500);
    });

    setSocket(newSocket);
  };

  const fetchCharacter = async () => {
    try {
      const response = await api.get('characters/me');
      setCharacter(response.data.character);
    } catch (err) {
      console.error('No character found');
      // Redirect to character creation if no character exists
      if (err.response?.status === 404) {
        window.location.href = '/character';
      }
    } finally {
      setLoading(false);
    }
  };

  const findMatch = () => {
    if (!socket?.connected || !character) return;
    const selectedSprite = character.customization?.selected_character || character.sprite_body || 'pink';
    socket.emit('matchmaking:join', { selectedCharacter: selectedSprite });
    setMatchStatus('queued');
  };

  const findAIMatch = () => {
    if (!socket?.connected || !character) return;
    const selectedSprite = character.customization?.selected_character || character.sprite_body || 'pink';
    socket.emit('matchmaking:ai', { 
      selectedCharacter: selectedSprite, 
      difficulty: selectedDifficulty 
    });
    setMatchStatus('ai-matching');
  };

  const cancelQueue = () => {
    socket?.emit('matchmaking:leave');
    setMatchStatus('idle');
  };

  const handleGameEnd = (data) => {
    setMatchStatus('idle');
    setMatchData(null);
    fetchCharacter();
  };

  if (matchStatus === 'playing' && matchData) {
    return (
      <div className="h-full bg-pixel-black">
        <GameCanvas
          socket={socket}
          matchId={matchData.matchId}
          initialState={matchData.initialState}
          myCharacterId={matchData.myCharacterId}
          myUserId={matchData.myUserId}
          isYourTurn={matchData.isYourTurn}
          onGameEnd={handleGameEnd}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-b from-pixel-black to-pixel-dark">
        <div className="pixel-card p-8 text-center">
          <div className="text-retro-purple text-lg mb-4 pixel-blink">LOADING</div>
          <div className="flex justify-center space-x-1 mb-4">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 bg-retro-purple pixel-blink"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
          <div className="text-pixel-mid text-xs">PREPARING BATTLE ARENA</div>
        </div>
      </div>
    );
  }

  const difficulties = [
    { id: 'easy', name: 'ROOKIE', icon: '●', color: 'text-retro-green' },
    { id: 'medium', name: 'VETERAN', icon: '◆', color: 'text-retro-yellow' },
    { id: 'hard', name: 'ELITE', icon: '▲', color: 'text-retro-orange' },
    { id: 'expert', name: 'LEGEND', icon: '★', color: 'text-retro-red' }
  ];

  const currentSprite = CHARACTER_SPRITES.find(s =>
    s.id === (character?.customization?.selected_character || character?.sprite_body)
  ) || CHARACTER_SPRITES[0];

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-full flex flex-col bg-gradient-to-b from-pixel-black via-pixel-dark to-pixel-black">
      {/* Header Bar */}
      <div className="pixel-card mx-4 mt-4 mb-2">
        <div className="flex items-center justify-between py-2">
          <div className="text-retro-purple text-sm">
            ▶ BATTLE ARENA ◀
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              socket?.connected ? 'bg-retro-green pixel-blink' : 'bg-retro-red'
            }`} />
            <div className="text-xs text-pixel-light">
              {socket?.connected ? 'ONLINE' : 'OFFLINE'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 pb-6">
        <div className="text-center max-w-lg w-full">
          {/* Enhanced Character Display */}
          {character && (
            <div className="mb-8">
              {/* Character Avatar with Glow Effect */}
              <div className="relative mb-6">
                <div className="pixel-card inline-block p-6 bg-gradient-to-br from-pixel-mid to-pixel-dark relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-retro-purple/20 via-transparent to-retro-pink/20 rounded-lg" />
                  <div className="w-32 h-32 mx-auto bg-pixel-black border-3 border-retro-purple flex items-center justify-center overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-retro-purple/10 to-transparent" />
                    <div
                      className="[image-rendering:pixelated] relative z-10"
                      style={{
                        backgroundImage: `url(${currentSprite.sprite})`,
                        backgroundSize: currentSprite.size === 'large' ? '384px 96px' : '128px 32px',
                        backgroundPosition: '0 0',
                        width: currentSprite.size === 'large' ? '96px' : '32px',
                        height: currentSprite.size === 'large' ? '96px' : '32px',
                        transform: currentSprite.size === 'large' ? 'scale(1.2)' : 'scale(3)',
                        filter: 'drop-shadow(0 0 4px rgba(155, 93, 229, 0.5))',
                      }}
                    />
                  </div>
                  {/* Character Level Badge */}
                  <div className="absolute -top-2 -right-2 bg-retro-purple border-3 border-pixel-black px-2 py-1">
                    <div className="text-pixel-black text-xs font-bold">LV.{character.level}</div>
                  </div>
                </div>
                {/* Character Info */}
                <div className="mt-4">
                  <div className="text-pixel-white text-lg mb-2 tracking-wider">{character.name?.toUpperCase()}</div>
                  <div className="text-retro-purple text-xs flex items-center justify-center space-x-2">
                    <span>◆</span>
                    <span>{currentSprite.name?.toUpperCase()}</span>
                    <span>◆</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Match Options */}
          {matchStatus === 'idle' && (
            <div className="w-full">
              {/* Battle Mode Selection */}
              <div className="pixel-card p-6 mb-6 bg-gradient-to-br from-pixel-mid to-pixel-dark">
                <div className="text-retro-purple text-sm mb-4 text-center">
                  ⚔ SELECT BATTLE MODE ⚔
                </div>
                
                {/* Ranked Match Button */}
                <button
                  onClick={findMatch}
                  disabled={!character}
                  className="pixel-btn pixel-btn-primary text-sm px-8 py-4 disabled:opacity-50 w-full mb-3 
                           hover:bg-retro-purple hover:shadow-pixel-purple transition-all duration-200
                           relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent 
                                translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  <div className="flex items-center justify-center space-x-2">
                    <span>🏆</span>
                    <span>RANKED MATCH</span>
                    <span>🏆</span>
                  </div>
                </button>
                
                {/* AI Battle Section */}
                <div className="border-3 border-pixel-light p-4 bg-pixel-black/50">
                  <div className="text-retro-orange text-xs mb-3 text-center">
                    🤖 AI OPPONENT
                  </div>
                  
                  {/* Difficulty Selector */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {difficulties.map((diff) => (
                      <button
                        key={diff.id}
                        onClick={() => setSelectedDifficulty(diff.id)}
                        className={`pixel-btn text-xs py-2 px-3 transition-all duration-200 ${
                          selectedDifficulty === diff.id 
                            ? 'bg-retro-orange border-retro-orange text-pixel-black'
                            : 'bg-pixel-mid border-pixel-light hover:border-retro-orange'
                        }`}
                      >
                        <div className="flex items-center justify-center space-x-1">
                          <span className={diff.color}>{diff.icon}</span>
                          <span>{diff.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={findAIMatch}
                    disabled={!character}
                    className="pixel-btn bg-retro-orange border-retro-orange text-pixel-black text-sm 
                             px-6 py-3 disabled:opacity-50 w-full hover:shadow-pixel transition-all duration-200
                             relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                                  translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                    <div className="flex items-center justify-center space-x-2">
                      <span>▶</span>
                      <span>START AI BATTLE</span>
                      <span>◀</span>
                    </div>
                  </button>
                </div>
              </div>
              
              <div className="text-pixel-mid text-xs text-center">
                💫 PROVE YOUR WORTH IN BATTLE 💫
              </div>
            </div>
          )}

          {matchStatus === 'ai-matching' && (
            <div className="pixel-card p-8 bg-gradient-to-br from-pixel-mid to-pixel-dark">
              <div className="text-center">
                <div className="text-retro-orange text-xl mb-6 pixel-blink">
                  🤖 AI INITIALIZING 🤖
                </div>
                
                {/* Enhanced Loading Animation */}
                <div className="flex justify-center mb-6">
                  <div className="flex space-x-1">
                    {[...Array(12)].map((_, i) => (
                      <div
                        key={i}
                        className="w-2 h-8 bg-retro-orange"
                        style={{
                          animation: `pixel-blink 1.5s ease-in-out ${i * 0.1}s infinite`,
                          opacity: 0.3 + (i % 3) * 0.3
                        }}
                      />
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2 text-xs">
                  <div className="text-pixel-white">CONFIGURING AI OPPONENT...</div>
                  <div className="text-retro-orange">DIFFICULTY: {difficulties.find(d => d.id === selectedDifficulty)?.name}</div>
                  <div className="text-pixel-mid">PREPARING BATTLE ARENA...</div>
                </div>
                
                {/* Progress Indicator */}
                <div className="w-64 mx-auto mt-6 border-3 border-pixel-light bg-pixel-black p-1">
                  <div className="h-3 bg-gradient-to-r from-retro-orange to-retro-yellow pixel-blink" />
                </div>
              </div>
            </div>
          )}

          {matchStatus === 'queued' && (
            <div className="pixel-card p-8 bg-gradient-to-br from-pixel-mid to-pixel-dark">
              <div className="text-center">
                {/* Enhanced Timer Display */}
                <div className="mb-6">
                  <div className="text-retro-purple text-3xl mb-2 pixel-blink font-bold">
                    {formatTime(queueTime)}
                  </div>
                  <div className="text-xs text-pixel-light">
                    SEARCH TIME
                  </div>
                </div>
                
                {/* Search Animation */}
                <div className="text-retro-green text-lg mb-4">
                  🔍 SEARCHING FOR WORTHY OPPONENT 🔍
                </div>
                
                {/* Animated Dots */}
                <div className="flex justify-center space-x-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="w-2 h-2 bg-retro-purple rounded-full"
                      style={{
                        animation: `pixel-blink 1s ease-in-out ${i * 0.2}s infinite`
                      }}
                    />
                  ))}
                </div>
                
                {/* Queue Stats */}
                <div className="text-xs text-pixel-mid mb-6 space-y-1">
                  <div>⚔ RANKED QUEUE ⚔</div>
                  <div>MATCHING BY ELO RATING</div>
                  <div className="text-retro-yellow">ELO: {character?.elo_rating || 1000}</div>
                </div>
                
                <button
                  onClick={cancelQueue}
                  className="pixel-btn bg-retro-red border-retro-red text-pixel-black px-8 py-3 
                           hover:shadow-pixel transition-all duration-200"
                >
                  ✖ CANCEL SEARCH
                </button>
              </div>
            </div>
          )}

          {matchStatus === 'matched' && (
            <div className="pixel-card p-8 bg-gradient-to-br from-retro-green/20 to-pixel-dark">
              <div className="text-center">
                <div className="text-retro-green text-2xl mb-4 pixel-blink font-bold">
                  ⚡ MATCH FOUND! ⚡
                </div>
                
                {/* Celebration Animation */}
                <div className="flex justify-center space-x-2 mb-6">
                  {['🎯', '⚔️', '🏆', '⚔️', '🎯'].map((emoji, i) => (
                    <div
                      key={i}
                      className="text-lg"
                      style={{
                        animation: `pixel-blink 0.8s ease-in-out ${i * 0.1}s infinite`
                      }}
                    >
                      {emoji}
                    </div>
                  ))}
                </div>
                
                <div className="text-pixel-white text-sm mb-2">
                  OPPONENT FOUND!
                </div>
                <div className="text-pixel-mid text-xs">
                  PREPARING BATTLE ARENA...
                </div>
                
                {/* Loading Bar */}
                <div className="w-48 mx-auto mt-4 border-3 border-retro-green bg-pixel-black p-1">
                  <div className="h-2 bg-retro-green pixel-blink" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Stats Dashboard */}
      {character && (
        <div className="m-4 mt-2">
          <div className="pixel-card bg-gradient-to-r from-pixel-mid via-pixel-dark to-pixel-mid">
            <div className="px-4 py-3">
              {/* Stats Header */}
              <div className="text-center mb-3">
                <div className="text-retro-purple text-xs">═══ WARRIOR STATS ═══</div>
              </div>
              
              {/* Main Stats Grid */}
              <div className="grid grid-cols-5 gap-4 mb-3">
                <StatItem icon="⚡" label="ELO" value={character.elo_rating} color="text-retro-yellow" />
                <StatItem icon="🏆" label="WINS" value={character.wins} color="text-retro-green" />
                <StatItem icon="💀" label="LOSSES" value={character.losses} color="text-retro-red" />
                <StatItem 
                  icon="📊" 
                  label="RATE" 
                  value={`${character.wins + character.losses > 0 ? Math.round(character.wins / (character.wins + character.losses) * 100) : 0}%`} 
                  color="text-retro-purple" 
                />
                <StatItem icon="🪙" label="COINS" value={character.coins} color="text-retro-yellow" />
              </div>
              
              {/* Progress Bar for Level */}
              <div className="border-2 border-pixel-light bg-pixel-black p-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-pixel-light">LEVEL {character.level}</span>
                  <span className="text-xs text-retro-purple">EXP: {character.experience || 0}</span>
                </div>
                <div className="h-2 bg-pixel-black border border-pixel-light">
                  <div 
                    className="h-full bg-gradient-to-r from-retro-purple to-retro-pink"
                    style={{ 
                      width: `${((character.experience || 0) % 100)}%`,
                      transition: 'width 0.3s ease'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatItem = ({ icon, label, value, color }) => (
  <div className="text-center">
    <div className={`text-sm ${color}`}>
      [{icon}] {value}
    </div>
    <div className="text-pixel-mid text-[8px]">{label}</div>
  </div>
);

export default Play;
