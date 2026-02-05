import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import CharacterCreate from '../components/CharacterCreate';

const Dashboard = () => {
  const [stats, setStats] = useState({
    matches: 0,
    friends: 0,
    notifications: 0
  });
  const [loading, setLoading] = useState(true);
  const [character, setCharacter] = useState(null);
  const [hasCharacter, setHasCharacter] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Check if user has a character
        const charResponse = await api.get('/api/v1/characters/me');
        if (charResponse.data) {
          setCharacter(charResponse.data);
          setHasCharacter(true);
        }

        // Fetch stats (mock for now)
        setStats({
          matches: 0,
          friends: 0,
          notifications: 0
        });
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        // If 404, user doesn't have a character yet
        if (error.response?.status === 404) {
          setHasCharacter(false);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleCharacterCreated = (newCharacter) => {
    setCharacter(newCharacter);
    setHasCharacter(true);
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  // Show character creation if user doesn't have one
  if (!hasCharacter) {
    return <CharacterCreate onCharacterCreated={handleCharacterCreated} />;
  }

  return (
    <div>
      <h1>Dashboard</h1>

      {character && (
        <div className="card" style={{ marginBottom: '30px', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '2px solid #4ecca3' }}>
          <h2 style={{ color: '#4ecca3' }}>👤 {character.name}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginTop: '20px' }}>
            <div>
              <strong>Level:</strong> {character.level}
            </div>
            <div>
              <strong>HP:</strong> {character.max_health}
            </div>
            <div>
              <strong>Attack:</strong> {character.attack}
            </div>
            <div>
              <strong>Defense:</strong> {character.defense}
            </div>
            <div>
              <strong>Speed:</strong> {character.speed}
            </div>
            <div>
              <strong>💰 Coins:</strong> {character.coins}
            </div>
            <div>
              <strong>🏆 ELO:</strong> {character.elo_rating}
            </div>
            <div>
              <strong>Wins:</strong> {character.wins}
            </div>
            <div>
              <strong>Losses:</strong> {character.losses}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div className="card">
          <h3>Matches Played</h3>
          <p style={{ fontSize: '2em', color: '#007bff', margin: '10px 0' }}>{stats.matches}</p>
          <Link to="/matches" className="btn btn-primary">View Matches</Link>
        </div>

        <div className="card">
          <h3>Friends</h3>
          <p style={{ fontSize: '2em', color: '#28a745', margin: '10px 0' }}>{stats.friends}</p>
          <Link to="/friends" className="btn btn-primary">Manage Friends</Link>
        </div>

        <div className="card">
          <h3>Notifications</h3>
          <p style={{ fontSize: '2em', color: '#ffc107', margin: '10px 0' }}>{stats.notifications}</p>
          <Link to="/notifications" className="btn btn-primary">View All</Link>
        </div>
      </div>

      <div className="card">
        <h2>Quick Actions</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '15px' }}>
          <Link to="/game" className="btn btn-primary" style={{ backgroundColor: '#4ecca3', fontSize: '18px', padding: '12px 24px' }}>🎮 Find PvP Match</Link>
          <Link to="/chat" className="btn btn-secondary">Open Chat</Link>
          <Link to="/friends/add" className="btn btn-secondary">Add Friend</Link>
        </div>
      </div>

      <div className="card">
        <h2>Recent Activity</h2>
        <div style={{ marginTop: '15px' }}>
          <p style={{ color: '#666', fontStyle: 'italic' }}>
            No recent activity to display. Start playing to see your game history here!
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
