/**
 * GameLayout - Main game client layout with pixel art style
 */

import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import FriendsPanel from './FriendsPanel';

const GameLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showFriends, setShowFriends] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/play', icon: '!', label: 'PLAY' },
    { path: '/character', icon: '@', label: 'CHAR' },
    { path: '/matches', icon: '#', label: 'MATCH' },
    { path: '/shop', icon: '$', label: 'SHOP' },
    { path: '/profile', icon: '%', label: 'PROFILE' },
  ];

  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="h-screen flex flex-col bg-pixel-black overflow-hidden">
      {/* Top Bar */}
      <header className="h-12 bg-pixel-dark border-b-3 border-pixel-mid flex items-center justify-between px-4 shrink-0">
        {/* Logo */}
        <Link to="/play" className="flex items-center gap-2">
          <span className="text-retro-purple">[=====&gt;</span>
          <span className="text-pixel-white text-xs hidden sm:block">
            STREET PIXEL WARS
          </span>
        </Link>

        {/* User Info */}
        <div className="flex items-center gap-3">
          <div className="pixel-card py-1 px-3 flex items-center gap-2">
            <span className="text-retro-green text-xs">*</span>
            <span className="text-pixel-white text-xs">
              {user?.username?.toUpperCase() || 'PLAYER'}
            </span>
          </div>

          <button
            onClick={() => setShowFriends(!showFriends)}
            className={`px-2 py-1 border-3 text-xs ${
              showFriends
                ? 'bg-retro-purple border-retro-purple text-pixel-black'
                : 'bg-pixel-mid border-pixel-light text-pixel-white'
            }`}
          >
            [+]
          </button>

          <button
            onClick={handleLogout}
            className="px-2 py-1 border-3 border-pixel-light bg-pixel-mid text-pixel-light text-xs hover:border-retro-red hover:text-retro-red"
            title="Logout"
          >
            [X]
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Navigation */}
        <nav className="w-16 bg-pixel-dark border-r-3 border-pixel-mid flex flex-col items-center py-2 gap-1 shrink-0">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`w-12 py-2 text-center border-3 ${
                isActive(item.path)
                  ? 'bg-retro-purple border-retro-purple text-pixel-black'
                  : 'bg-pixel-mid border-pixel-light text-pixel-light hover:border-retro-purple hover:text-retro-purple'
              }`}
            >
              <div className="text-sm">[{item.icon}]</div>
              <div className="text-[6px] mt-1">{item.label}</div>
            </Link>
          ))}

          <div className="flex-1" />

          {/* Settings at bottom */}
          <Link
            to="/settings"
            className="w-12 py-2 text-center border-3 border-pixel-light bg-pixel-mid text-pixel-light hover:border-retro-purple hover:text-retro-purple"
          >
            <div className="text-sm">[?]</div>
            <div className="text-[6px] mt-1">SET</div>
          </Link>
        </nav>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-pixel-black">
          {children}
        </main>

        {/* Right Sidebar - Friends Panel */}
        {showFriends && (
          <FriendsPanel onClose={() => setShowFriends(false)} />
        )}
      </div>
    </div>
  );
};

export default GameLayout;
