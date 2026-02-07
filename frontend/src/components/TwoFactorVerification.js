import React, { useState } from 'react';

const TwoFactorVerification = ({ onVerify, onCancel, loading }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!code || code.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }
    setError('');
    onVerify(code);
  };

  return (
    <div className="pixel-card p-6 max-w-md mx-auto">
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-retro-purple text-sm mb-2">🔐 TWO-FACTOR AUTHENTICATION</div>
          <div className="text-pixel-light text-xs leading-relaxed">
            Enter the 6-digit code from your authenticator app
          </div>
        </div>

        {error && (
          <div className="bg-retro-red bg-opacity-20 border border-retro-red p-2 rounded">
            <div className="text-retro-red text-xs">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-pixel-white text-xs block">
              AUTHENTICATION CODE:
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength="6"
              className="pixel-input w-full text-center text-lg tracking-widest"
              placeholder="000000"
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="flex justify-center space-x-2">
            <button 
              type="submit"
              disabled={loading || code.length !== 6}
              className="pixel-btn pixel-btn-primary"
            >
              {loading ? 'VERIFYING...' : 'VERIFY'}
            </button>
            <button 
              type="button" 
              onClick={onCancel} 
              className="pixel-btn"
              disabled={loading}
            >
              CANCEL
            </button>
          </div>
        </form>

        <div className="text-center">
          <div className="text-pixel-light text-xs">
            Can't access your authenticator app?
          </div>
        </div>
      </div>
    </div>
  );
};

export default TwoFactorVerification;