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

    if (formData.password !== formData.confirmPassword) {
      setError('PASSWORDS DO NOT MATCH');
      setLoading(false);
      return;
    }

    const result = await register(formData.username, formData.email, formData.password);

    if (result.success) {
      setSuccess('SAVE FILE CREATED!');
      setTimeout(() => {
        navigate('/character');
      }, 1000);
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-pixel-black flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="text-retro-purple text-lg">
            [=====&gt;
          </Link>
          <h1 className="text-xl text-pixel-white mt-4 mb-2">NEW GAME</h1>
          <p className="text-pixel-light text-xs">CREATE YOUR SAVE FILE</p>
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
          <Link to="/" className="text-pixel-mid text-xs block hover:text-pixel-light">
            {'<'} BACK
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
