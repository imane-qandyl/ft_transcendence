/**
 * GameLayout - Main game client layout with pixel art style
 */

import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import FriendsPanel from './FriendsPanel';
import api from '../services/api';

const GameLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showFriends, setShowFriends] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

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

  // Fetch unread notifications count
  useEffect(() => {
    if (!user) return;
    
    const fetchNotifications = async () => {
      try {
        const response = await api.get('/api/v1/notifications/others');
        const notifications = response.data.data || [];
        const unreadCount = notifications.filter(n => !n.is_read).length;
        setUnreadNotifications(unreadCount);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };
    
    fetchNotifications();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(interval);
  }, [user]);

  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="h-screen flex flex-col bg-pixel-black overflow-hidden">
      {/* Top Bar */}
      <header className="h-12 bg-pixel-dark border-b-3 border-pixel-mid flex items-center justify-between px-4 shrink-0">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setShowMobileNav(!showMobileNav)}
          className="md:hidden px-2 py-1 border-3 border-pixel-light bg-pixel-mid text-pixel-white text-xs hover:border-retro-purple hover:text-retro-purple"
        >
          [≡]
        </button>
        
        {/* Logo */}
        <Link to="/play" className="flex items-center gap-2">
          <span className="text-retro-purple text-sm sm:text-base">[=====&gt;</span>
          <span className="text-pixel-white text-xs sm:text-sm hidden sm:block">
            STREET PIXEL WARS
          </span>
        </Link>

        {/* User Info */}
        <div className="flex items-center gap-1 sm:gap-3">
          <div className="pixel-card py-1 px-2 sm:px-3 flex items-center gap-1 sm:gap-2">
            <span className="text-retro-green text-xs">*</span>
            <span className="text-pixel-white text-xs hidden sm:inline">
              {user?.username?.toUpperCase() || 'PLAYER'}
            </span>
          </div>

          <button
            onClick={() => setShowFriends(!showFriends)}
            className={`px-1 sm:px-2 py-1 border-3 text-xs hidden md:block ${
              showFriends
                ? 'bg-retro-purple border-retro-purple text-pixel-black'
                : 'bg-pixel-mid border-pixel-light text-pixel-white'
            }`}
          >
            [+]
          </button>

          <Link
            to="/notifications"
            className={`px-1 sm:px-2 py-1 border-3 text-xs relative ${
              isActive('/notifications')
                ? 'bg-retro-purple border-retro-purple text-pixel-black'
                : 'bg-pixel-mid border-pixel-light text-pixel-white hover:border-retro-purple hover:text-retro-purple'
            }`}
            title="Notifications"
          >
            [*]
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 bg-retro-red text-pixel-white text-[8px] px-1 min-w-[12px] h-3 flex items-center justify-center border border-pixel-black">
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </span>
            )}
          </Link>

          <button
            onClick={handleLogout}
            className="px-1 sm:px-2 py-1 border-3 border-pixel-light bg-pixel-mid text-pixel-light text-xs hover:border-retro-red hover:text-retro-red"
            title="Logout"
          >
            [X]
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile Navigation Overlay */}
        {showMobileNav && (
          <div className="md:hidden fixed inset-0 z-50 bg-pixel-black bg-opacity-90">
            <div className="bg-pixel-dark border-r-3 border-pixel-mid w-64 h-full p-4">
              <div className="flex justify-between items-center mb-6">
                <div className="text-retro-purple text-sm">NAVIGATION</div>
                <button
                  onClick={() => setShowMobileNav(false)}
                  className="px-2 py-1 border-3 border-pixel-light bg-pixel-mid text-pixel-light text-xs"
                >
                  [X]
                </button>
              </div>
              <div className="space-y-3">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setShowMobileNav(false)}
                    className={`flex items-center gap-3 w-full p-3 border-3 text-sm ${
                      isActive(item.path)
                        ? 'bg-retro-purple border-retro-purple text-pixel-black'
                        : 'bg-pixel-mid border-pixel-light text-pixel-light hover:border-retro-purple hover:text-retro-purple'
                    }`}
                  >
                    <span>[{item.icon}]</span>
                    <span>{item.label}</span>
                  </Link>
                ))}
                <Link
                  to="/settings"
                  onClick={() => setShowMobileNav(false)}
                  className="flex items-center gap-3 w-full p-3 border-3 text-sm border-pixel-light bg-pixel-mid text-pixel-light hover:border-retro-purple hover:text-retro-purple"
                >
                  <span>[?]</span>
                  <span>SETTINGS</span>
                </Link>
              </div>
            </div>
          </div>
        )}
        
        {/* Left Sidebar - Navigation (Desktop) */}
        <nav className="w-16 bg-pixel-dark border-r-3 border-pixel-mid flex flex-col items-center py-2 gap-1 shrink-0 hidden md:flex">
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
        <main className="flex-1 flex flex-col bg-pixel-black relative">
          <div className="flex-1 overflow-auto">
            <div className="min-h-full">
              {children}
            </div>
          </div>
          
          {/* Footer - Always at bottom of viewport */}
          <footer className="shrink-0 py-2 text-center border-t-3 border-pixel-mid bg-pixel-black z-30">
            <div className="flex justify-center gap-4 text-xs">
              <Link to="/privacy" className="text-pixel-mid hover:text-retro-purple">
                Privacy
              </Link>
              <span className="text-pixel-mid">|</span>
              <Link to="/terms" className="text-pixel-mid hover:text-retro-purple">
                Terms
              </Link>
            </div>
          </footer>
          
          {/* Mobile Friends Button */}
          <button
            onClick={() => setShowFriends(true)}
            className="md:hidden fixed bottom-20 right-4 z-40 w-12 h-12 bg-retro-purple border-3 border-pixel-light text-pixel-black text-sm hover:bg-retro-pink"
            style={{ boxShadow: '4px 4px 0px #0f0f1b' }}
          >
            [+]
          </button>
        </main>

        {/* Right Sidebar - Friends Panel (Desktop) */}
        {showFriends && (
          <div className="hidden md:block h-full">
            <FriendsPanel onClose={() => setShowFriends(false)} />
          </div>
        )}
        
        {/* Mobile Friends Panel */}
        {showFriends && (
          <div className="md:hidden fixed inset-0 z-50">
            <FriendsPanel onClose={() => setShowFriends(false)} />
          </div>
        )}
      </div>
    </div>
  );
};

export default GameLayout;
