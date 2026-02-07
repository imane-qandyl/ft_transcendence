import React, { useState } from 'react';
import twoFactorService from '../services/twoFactorService';

const DisableTwoFactor = ({ onDisableComplete, onCancel }) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDisable2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await twoFactorService.disable(verificationCode);
      if (response.success) {
        onDisableComplete();
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  if (!showConfirm) {
    return (
      <div className="pixel-card p-4">
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-retro-red text-xs mb-2">⚠ DISABLE TWO-FACTOR AUTHENTICATION</div>
            <div className="text-pixel-light text-xs leading-relaxed">
              This will remove 2FA protection from your account, making it less secure.
            </div>
          </div>

          <div className="flex justify-center space-x-2">
            <button 
              onClick={() => setShowConfirm(true)}
              className="pixel-btn pixel-btn-danger"
            >
              CONTINUE
            </button>
            <button onClick={onCancel} className="pixel-btn">
              CANCEL
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pixel-card p-4">
      {error && (
        <div className="bg-retro-red bg-opacity-20 border border-retro-red p-2 rounded mb-4">
          <div className="text-retro-red text-xs">{error}</div>
        </div>
      )}
      
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-retro-red text-xs mb-2">CONFIRM DISABLE 2FA</div>
          <div className="text-pixel-light text-xs leading-relaxed mb-4">
            Enter a code from your authenticator app to confirm disabling 2FA
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-pixel-white text-xs block">
            ENTER 6-DIGIT CODE:
          </label>
          <input
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            maxLength="6"
            className="pixel-input w-full text-center text-lg tracking-widest"
            placeholder="000000"
          />
        </div>
        
        <div className="flex justify-center space-x-2">
          <button 
            onClick={handleDisable2FA}
            disabled={loading || verificationCode.length !== 6}
            className="pixel-btn pixel-btn-danger"
          >
            {loading ? 'DISABLING...' : 'DISABLE 2FA'}
          </button>
          <button onClick={onCancel} className="pixel-btn">
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );
};

export default DisableTwoFactor;