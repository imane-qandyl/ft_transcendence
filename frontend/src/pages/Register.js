import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import GoogleSignInButton from '../components/GoogleSignInButton';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
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
    setSuccess('');
    setLoading(true);

    const trimmedUsername = formData.username.trim();
    const trimmedEmail = formData.email.trim();

    if (!trimmedUsername || trimmedUsername.length < 3) {
      setError('USERNAME MUST BE AT LEAST 3 CHARACTERS');
      setLoading(false);
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
      setError('USERNAME CAN ONLY CONTAIN LETTERS, NUMBERS, AND UNDERSCORES');
      setLoading(false);
      return;
    }

    if (!trimmedEmail || !/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      setError('PLEASE ENTER A VALID EMAIL ADDRESS');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('PASSWORD MUST BE AT LEAST 8 CHARACTERS');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('PASSWORDS DO NOT MATCH');
      setLoading(false);
      return;
    }

    try {
      const result = await register(trimmedUsername, trimmedEmail, formData.password);

      if (result.success) {
        setSuccess('SAVE FILE CREATED!');
        setTimeout(() => {
          navigate('/character');
        }, 1000);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Registration failed. Please try again.');
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
          <h1 className="text-lg sm:text-xl text-pixel-white mt-3 sm:mt-4 mb-2">NEW GAME</h1>
          <p className="text-pixel-light text-xs sm:text-sm">CREATE YOUR SAVE FILE</p>
        </div>

        {/* Form Card */}
        <div className="pixel-card">
          <div className="text-center text-pixel-light text-xs mb-4">
            +------------------+
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-pixel-light text-xs mb-2">
                PLAYER NAME:
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                minLength={3}
                maxLength={30}
                className="pixel-input"
                placeholder="_"
              />
            </div>

            <div>
              <label className="block text-pixel-light text-xs mb-2">
                EMAIL:
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
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
                minLength={8}
                maxLength={128}
                className="pixel-input"
                placeholder="_"
              />
            </div>

            <div>
              <label className="block text-pixel-light text-xs mb-2">
                CONFIRM PASSWORD:
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength={8}
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

            {success && (
              <div className="bg-pixel-black border-3 border-retro-green p-3">
                <p className="text-retro-green text-xs">* {success}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="pixel-btn pixel-btn-primary w-full text-xs disabled:opacity-50"
            >
              {loading ? '..SAVING..' : '> CREATE <'}
            </button>
          </form>

          {/* Google Sign-In */}
          <div className="mt-6">
            <GoogleSignInButton 
              onSuccess={() => navigate('/character')}
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
            HAVE A SAVE FILE?{' '}
            <Link to="/login" className="text-retro-purple hover:text-retro-pink">
              CONTINUE
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

export default Register;
