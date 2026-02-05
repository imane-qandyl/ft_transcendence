/**
 * Play Page - Pixel art style game hub
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
      const response = await api.get('/api/v1/characters/me');
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
      <div className="h-full flex items-center justify-center">
        <div className="text-retro-purple text-xs pixel-blink">LOADING...</div>
      </div>
    );
  }

  const currentSprite = CHARACTER_SPRITES.find(s =>
    s.id === (character?.customization?.selected_character || character?.sprite_body)
  ) || CHARACTER_SPRITES[0];

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full flex flex-col p-4">
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          {/* Character Display */}
          {character && (
            <div className="mb-8">
              {/* Pixel Character Box */}
              <div className="pixel-card inline-block p-4 mb-4">
                <div className="w-24 h-24 mx-auto bg-pixel-black border-3 border-pixel-light flex items-center justify-center overflow-hidden">
                  <div
                    className="[image-rendering:pixelated]"
                    style={{
                      backgroundImage: `url(${currentSprite.sprite})`,
                      backgroundSize: currentSprite.size === 'large' ? '384px 96px' : '128px 32px',
                      backgroundPosition: '0 0',
                      width: currentSprite.size === 'large' ? '96px' : '32px',
                      height: currentSprite.size === 'large' ? '96px' : '32px',
                      transform: currentSprite.size === 'large' ? 'scale(1)' : 'scale(2.5)',
                    }}
                  />
                </div>
              </div>
              <div className="text-pixel-white text-sm mb-1">{character.name?.toUpperCase()}</div>
              <div className="text-retro-purple text-xs">
                LV.{character.level} {currentSprite.name?.toUpperCase()}
              </div>
            </div>
          )}

          {/* Match Status */}
          {matchStatus === 'idle' && (
            <div>
              <button
                onClick={findMatch}
                disabled={!character}
                className="pixel-btn pixel-btn-primary text-sm px-12 py-4 disabled:opacity-50"
              >
                {'>'} PLAY {'<'}
              </button>
              <div className="mt-4 text-pixel-mid text-xs">
                1v1 RANKED BATTLE
              </div>
            </div>
          )}

          {matchStatus === 'queued' && (
            <div className="pixel-card p-6">
              <div className="text-retro-purple text-lg mb-4 pixel-blink">
                {formatTime(queueTime)}
              </div>
              <div className="text-pixel-white text-xs mb-2">
                SEARCHING FOR MATCH
              </div>
              <div className="text-pixel-mid text-xs mb-6">
                .....
              </div>
              <button
                onClick={cancelQueue}
                className="pixel-btn text-xs"
              >
                CANCEL
              </button>
            </div>
          )}

          {matchStatus === 'matched' && (
            <div className="pixel-card p-6">
              <div className="text-retro-green text-sm pixel-blink">
                ! MATCH FOUND !
              </div>
              <div className="text-pixel-mid text-xs mt-2">
                PREPARING BATTLE...
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Stats Bar */}
      {character && (
        <div className="pixel-card">
          <div className="flex items-center justify-center gap-6 py-2">
            <StatItem icon="*" label="ELO" value={character.elo_rating} color="text-retro-yellow" />
            <StatItem icon="+" label="WIN" value={character.wins} color="text-retro-green" />
            <StatItem icon="-" label="LOSS" value={character.losses} color="text-retro-red" />
            <StatItem icon="%" label="RATE" value={`${character.wins + character.losses > 0 ? Math.round(character.wins / (character.wins + character.losses) * 100) : 0}%`} color="text-retro-purple" />
            <StatItem icon="$" label="COIN" value={character.coins} color="text-retro-yellow" />
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
