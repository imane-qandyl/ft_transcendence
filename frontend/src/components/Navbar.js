import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  const NavLink = ({ to, children }) => (
    <Link
      to={to}
      className={`px-4 py-2 rounded-lg transition-all font-medium
        ${isActive(to)
          ? 'bg-game-accent text-game-bg'
          : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}
    >
      {children}
    </Link>
  );

  return (
    <nav className="bg-game-card border-b border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-game-accent hover:text-white transition-colors">
            <span className="text-2xl">⚔️</span>
            <span className="hidden sm:inline">Street Pixel Wars</span>
            <span className="sm:hidden">SPW</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <NavLink to="/dashboard">📊 Dashboard</NavLink>
                <NavLink to="/character">🎮 Play</NavLink>
                <NavLink to="/friends">👥 Friends</NavLink>
                <NavLink to="/chat">💬 Chat</NavLink>
                <button
                  onClick={handleLogout}
                  className="ml-2 px-4 py-2 bg-game-red text-white rounded-lg font-medium hover:brightness-110 transition-all"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login">Login</NavLink>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-game-accent text-game-bg rounded-lg font-bold hover:brightness-110 transition-all"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
