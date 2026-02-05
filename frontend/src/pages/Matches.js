import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Matches = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const response = await api.get('/api/v1/matches');
      setMatches(response.data.matches || []);
    } catch (error) {
      console.error('Failed to fetch matches:', error);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  const getResultText = (match) => {
    if (!user) return '';

    if (match.status !== 'completed') {
      return match.status.toUpperCase();
    }

    if (!match.winner_id) {
      return 'DRAW';
    }

    return match.winner_id === user.id ? 'VICTORY' : 'DEFEAT';
  };

  const getResultColor = (match) => {
    if (match.status !== 'completed') {
      return '#fee440'; // yellow for pending/in_progress
    }

    if (!match.winner_id) {
      return '#4a4a68'; // gray for draw
    }

    return match.winner_id === user?.id ? '#00f5d4' : '#ff6b6b'; // green for win, red for loss
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-pixel-black p-8 flex items-center justify-center">
        <div className="text-pixel-white text-xs">LOADING BATTLE LOGS...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pixel-black p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-retro-purple text-xs mb-2">{'>'} BATTLE RECORDS {'<'}</div>
          <h1 className="text-2xl text-pixel-white mb-2">MATCH HISTORY</h1>
          <div className="text-pixel-light text-xs">YOUR COMBAT ARCHIVE</div>
        </div>

        {/* Matches List */}
        <div className="pixel-card p-6">
          {matches.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">⚔️</div>
              <div className="text-pixel-light text-xs mb-2">NO BATTLES RECORDED</div>
              <div className="text-pixel-white text-xs">
                START A MATCH TO BUILD YOUR LEGEND
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {matches.map((match, index) => (
                <div
                  key={match.id}
                  className="pixel-card bg-pixel-dark p-4 border-2 border-pixel-mid"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="text-retro-pink text-xs">
                      BATTLE #{matches.length - index}
                    </div>
                    <div
                      className="px-3 py-1 text-xs font-bold"
                      style={{
                        backgroundColor: getResultColor(match),
                        color: '#0f0f1b',
                        boxShadow: '2px 2px 0px #0f0f1b'
                      }}
                    >
                      {getResultText(match)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1 text-right pr-4">
                      <div className={`text-xs ${match.player1_id === user?.id ? 'text-retro-blue font-bold' : 'text-pixel-white'}`}>
                        {match.player1_username || 'Unknown'}
                      </div>
                      <div className="text-2xl text-retro-purple font-bold mt-1">
                        {match.player1_score || 0}
                      </div>
                    </div>

                    <div className="text-pixel-light text-sm px-4">VS</div>

                    <div className="flex-1 text-left pl-4">
                      <div className={`text-xs ${match.player2_id === user?.id ? 'text-retro-blue font-bold' : 'text-pixel-white'}`}>
                        {match.player2_username || 'Unknown'}
                      </div>
                      <div className="text-2xl text-retro-purple font-bold mt-1">
                        {match.player2_score || 0}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs text-pixel-light pt-3 border-t border-pixel-mid">
                    <div>
                      TYPE: {(match.match_type || 'classic').toUpperCase()}
                    </div>
                    <div>
                      {new Date(match.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Matches;