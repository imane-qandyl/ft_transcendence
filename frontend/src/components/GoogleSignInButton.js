import React, { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import googleAuthService from '../services/googleAuth';

const GoogleSignInButton = ({ onSuccess, onError }) => {
  const buttonRef = useRef(null);
  const initializedRef = useRef(false);
  const { googleSignIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const init = async () => {
      try {
        await googleAuthService.init();

        googleAuthService.onSignIn(async (credential) => {
          try {
            const result = await googleSignIn(credential);

            if (result.success) {
              onSuccess ? onSuccess(result) : navigate('/character');
            } else {
              onError?.(result.error);
            }
          } catch (err) {
            onError?.(err.message);
          }
        });

        if (buttonRef.current) {
          googleAuthService.renderButton(
            buttonRef.current,
            'outline',
            'large'
          );
        }
      } catch (err) {
        console.error('💥 Google Sign-In init failed:', err);
        onError?.(err.message);
      }
    };

    init();
  }, []); // 🔒 MUST be empty

  return (
    <div className="w-full">
      <div className="text-center text-pixel-light text-xs mb-2">OR</div>
      <div
        ref={buttonRef}
        className="flex justify-center"
        style={{ minHeight: '40px' }}
      />
    </div>
  );
};

export default GoogleSignInButton;
