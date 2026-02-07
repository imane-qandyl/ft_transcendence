import React, { useState } from 'react';
import twoFactorService from '../services/twoFactorService';

const SetupTwoFactor = ({ onSetupComplete, onCancel }) => {
  const [step, setStep] = useState('initial'); // initial, qrcode, verify, complete
  const [qrCode, setQrCode] = useState('');
  const [otpauthUrl, setOtpauthUrl] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEnable2FA = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await twoFactorService.enable();
      if (response.success) {
        setQrCode(response.data.qr);
        setOtpauthUrl(response.data.otpauth_url);
        setStep('qrcode');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to enable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySetup = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await twoFactorService.verify(verificationCode);
      if (response.success) {
        setStep('complete');
        setTimeout(() => {
          onSetupComplete();
        }, 2000);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'initial':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-retro-purple text-xs mb-2">SETUP TWO-FACTOR AUTHENTICATION</div>
              <div className="text-pixel-light text-xs leading-relaxed mb-4">
                Add an extra layer of security to your account by enabling 2FA with an authenticator app.
              </div>
            </div>
            <div className="text-pixel-white text-xs space-y-2 mb-4">
              <p>You'll need an authenticator app like:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Google Authenticator</li>
                <li>Authy</li>
                <li>Microsoft Authenticator</li>
              </ul>
            </div>
            <div className="flex justify-center space-x-2">
              <button 
                onClick={handleEnable2FA}
                disabled={loading}
                className="pixel-btn pixel-btn-primary"
              >
                {loading ? 'SETTING UP...' : 'SETUP 2FA'}
              </button>
              <button onClick={onCancel} className="pixel-btn">
                CANCEL
              </button>
            </div>
          </div>
        );

      case 'qrcode':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-retro-purple text-xs mb-2">SCAN QR CODE</div>
              <div className="text-pixel-light text-xs leading-relaxed mb-4">
                Scan this QR code with your authenticator app
              </div>
            </div>
            
            {qrCode && (
              <div className="flex justify-center mb-4">
                <div className="bg-white p-4 rounded">
                  <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
                </div>
              </div>
            )}
            
            <div className="text-pixel-white text-xs text-center mb-4">
              <p>Can't scan? Enter this code manually:</p>
              <div className="bg-pixel-dark p-2 rounded mt-2 font-mono text-xs break-all">
                {otpauthUrl}
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-pixel-white text-xs block">
                ENTER 6-DIGIT CODE FROM APP:
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
                onClick={handleVerifySetup}
                disabled={loading || verificationCode.length !== 6}
                className="pixel-btn pixel-btn-primary"
              >
                {loading ? 'VERIFYING...' : 'VERIFY & ENABLE'}
              </button>
              <button onClick={onCancel} className="pixel-btn">
                CANCEL
              </button>
            </div>
          </div>
        );

      case 'complete':
        return (
          <div className="space-y-4 text-center">
            <div className="text-retro-green text-xs mb-2">✓ 2FA ENABLED!</div>
            <div className="text-pixel-light text-xs leading-relaxed">
              Your account is now protected with two-factor authentication.
              You'll need to enter a code from your authenticator app when logging in.
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="pixel-card p-4">
      {error && (
        <div className="bg-retro-red bg-opacity-20 border border-retro-red p-2 rounded mb-4">
          <div className="text-retro-red text-xs">{error}</div>
        </div>
      )}
      {renderStep()}
    </div>
  );
};

export default SetupTwoFactor;