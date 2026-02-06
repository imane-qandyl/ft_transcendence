import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import GoogleSignInButton from '../components/GoogleSignInButton';

const Login = () => {
  const [formData, setFormData] = useState({
    emailOrUsername: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(formData.emailOrUsername, formData.password);

    if (result.success) {
      navigate('/play');
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-pixel-black flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-xs sm:max-w-sm">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <Link to="/" className="text-retro-purple text-base sm:text-lg">
            [=====&gt;
          </Link>
          <h1 className="text-lg sm:text-xl text-pixel-white mt-3 sm:mt-4 mb-2">CONTINUE</h1>
          <p className="text-pixel-light text-xs sm:text-sm">ENTER YOUR CREDENTIALS</p>
        </div>

        {/* Form Card */}
        <div className="pixel-card">
          <div className="text-center text-pixel-light text-xs mb-4">
            +------------------+
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-pixel-light text-xs mb-2">
                USERNAME/EMAIL:
              </label>
              <input
                type="text"
                name="emailOrUsername"
                value={formData.emailOrUsername}
                onChange={handleChange}
                required
                className="pixel-input"
                placeholder="_"
              />
            </div>

            <div>
              <label className="block text-pixel-light text-xs mb-2">
                PASSWORD:
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="pixel-input"
                placeholder="_"
              />
            </div>

            {error && (
              <div className="bg-pixel-black border-3 border-retro-red p-3">
                <p className="text-retro-red text-xs">! {error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="pixel-btn pixel-btn-primary w-full text-xs disabled:opacity-50"
            >
              {loading ? '..LOADING..' : '> LOGIN <'}
            </button>
          </form>

          {/* Google Sign-In */}
          <div className="mt-6">
            <GoogleSignInButton 
              onSuccess={() => navigate('/play')}
              onError={(error) => setError(error)}
            />
          </div>

          <div className="text-center text-pixel-light text-xs mt-4">
            +------------------+
          </div>
        </div>

        {/* Footer Links */}
        <div className="text-center mt-6 space-y-3">
          <p className="text-pixel-light text-xs">
            NO SAVE FILE?{' '}
            <Link to="/register" className="text-retro-purple hover:text-retro-pink">
              NEW GAME
            </Link>
          </p>
          <div className="flex justify-center gap-4 text-xs mb-2">
            <Link to="/privacy" className="text-pixel-mid hover:text-retro-purple">
              Privacy
            </Link>
            <span className="text-pixel-mid">|</span>
            <Link to="/terms" className="text-pixel-mid hover:text-retro-purple">
              Terms
            </Link>
          </div>
          <Link to="/" className="text-pixel-mid text-xs block hover:text-pixel-light">
            {'<'} BACK
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
