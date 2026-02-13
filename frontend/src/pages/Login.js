import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import GoogleSignInButton from '../components/GoogleSignInButton';
import TwoFactorVerification from '../components/TwoFactorVerification';
import twoFactorService from '../services/twoFactorService';

const Login = () => {
  const [formData, setFormData] = useState({
    emailOrUsername: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [tempCredentials, setTempCredentials] = useState(null);

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

    const trimmedInput = formData.emailOrUsername.trim();
    if (!trimmedInput) {
      setError('Please enter your username or email');
      setLoading(false);
      return;
    }

    if (!formData.password) {
      setError('Please enter your password');
      setLoading(false);
      return;
    }

    try {
      const result = await login(trimmedInput, formData.password);

      if (result.success) {
        navigate('/play');
      } else if (result.requires2FA) {
        // 2FA is required
        setTempCredentials(formData);
        setShow2FA(true);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Login failed. Please try again.');
    }

    setLoading(false);
  };

  const handle2FAVerification = async (twoFactorCode) => {
    setLoading(true);
    setError('');

    try {
      const result = await twoFactorService.loginWith2FA(tempCredentials, twoFactorCode);
      
      if (result.user && result.token) {
        // Store the token
        localStorage.setItem('token', result.token);
        navigate('/play');
      } else {
        setError('2FA verification failed');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Invalid 2FA code');
    } finally {
      setLoading(false);
    }
  };

  const handle2FACancel = () => {
    setShow2FA(false);
    setTempCredentials(null);
    setError('');
  };

  if (show2FA) {
    return (
      <div className="min-h-screen bg-pixel-black flex items-center justify-center px-4 py-8">
        <TwoFactorVerification
          onVerify={handle2FAVerification}
          onCancel={handle2FACancel}
          loading={loading}
        />
        {error && (
          <div className="fixed bottom-4 left-4 right-4">
            <div className="bg-retro-red bg-opacity-20 border border-retro-red p-3 rounded max-w-md mx-auto">
              <p className="text-retro-red text-xs text-center">{error}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

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
                maxLength={255}
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
                maxLength={128}
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
