/**
 * Privacy Policy Page
 */

import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-pixel-black flex flex-col">
      {/* Header */}
      <header className="py-4 px-4 border-b-3 border-pixel-mid">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-retro-purple text-base">[=====&gt;</span>
            <span className="text-pixel-white text-sm">
              STREET PIXEL WARS
            </span>
          </Link>
          <Link 
            to="/" 
            className="px-3 py-1 border-3 border-pixel-light bg-pixel-mid text-pixel-light text-xs hover:border-retro-purple hover:text-retro-purple"
          >
            [HOME]
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="pixel-card mb-8">
            <h1 className="text-retro-purple text-xl mb-6 text-center">
              PRIVACY POLICY
            </h1>
            
            <div className="text-pixel-light text-sm space-y-6">
              <div>
                <h2 className="text-retro-green text-base mb-3">INFORMATION WE COLLECT</h2>
                <p className="mb-2">
                  Street Pixel Wars collects the following information to provide and improve our gaming service:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Account information (username, email address)</li>
                  <li>Google account information when using Google Sign-In</li>
                  <li>Game progress and statistics</li>
                  <li>Chat messages and communication data</li>
                  <li>Friend connections and social interactions</li>
                  <li>Device and browser information for technical support</li>
                </ul>
              </div>

              <div>
                <h2 className="text-retro-green text-base mb-3">HOW WE USE YOUR INFORMATION</h2>
                <p className="mb-2">
                  We use your information to:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Create and manage your game account</li>
                  <li>Save your game progress and character data</li>
                  <li>Enable multiplayer features and matchmaking</li>
                  <li>Facilitate chat and social features</li>
                  <li>Send game notifications and updates</li>
                  <li>Improve our game and fix technical issues</li>
                  <li>Prevent cheating and maintain fair play</li>
                </ul>
              </div>

              <div>
                <h2 className="text-retro-green text-base mb-3">DATA SHARING AND DISCLOSURE</h2>
                <p className="mb-2">
                  We do not sell, trade, or rent your personal information to third parties. We may share limited data only in these circumstances:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>With your consent for specific features</li>
                  <li>To comply with legal requirements</li>
                  <li>To protect our rights and the safety of our users</li>
                  <li>In the event of a business transfer or merger</li>
                </ul>
              </div>

              <div>
                <h2 className="text-retro-green text-base mb-3">DATA SECURITY</h2>
                <p>
                  We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. This includes encrypted data transmission and secure server infrastructure.
                </p>
              </div>

              <div>
                <h2 className="text-retro-green text-base mb-3">YOUR RIGHTS</h2>
                <p className="mb-2">
                  You have the right to:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Access your personal information</li>
                  <li>Correct inaccurate data</li>
                  <li>Delete your account and associated data</li>
                  <li>Opt out of non-essential communications</li>
                  <li>Request data portability</li>
                </ul>
              </div>

              <div>
                <h2 className="text-retro-green text-base mb-3">COOKIES AND TRACKING</h2>
                <p>
                  We use session cookies and local storage to maintain your login state and game preferences. We do not use third-party advertising cookies or tracking technologies.
                </p>
              </div>

              <div>
                <h2 className="text-retro-green text-base mb-3">CHILDREN'S PRIVACY</h2>
                <p>
                  Street Pixel Wars is intended for users 13 years and older. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately.
                </p>
              </div>

              <div>
                <h2 className="text-retro-green text-base mb-3">CHANGES TO THIS POLICY</h2>
                <p>
                  We may update this Privacy Policy from time to time. We will notify users of significant changes through in-game notifications or email. Your continued use of the service after changes constitutes acceptance of the updated policy.
                </p>
              </div>

              <div>
                <h2 className="text-retro-green text-base mb-3">CONTACT US</h2>
                <p>
                  If you have questions about this Privacy Policy or wish to exercise your privacy rights, please contact us at privacy@streetpixelwars.com
                </p>
              </div>

              <div className="text-center text-pixel-mid text-xs mt-8">
                Last Updated: February 6, 2026
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center border-t-3 border-pixel-mid">
        <div className="flex justify-center gap-4 text-xs mb-2">
          <Link to="/privacy" className="text-pixel-mid hover:text-retro-purple">
            Privacy Policy
          </Link>
          <span className="text-pixel-mid">|</span>
          <Link to="/terms" className="text-pixel-mid hover:text-retro-purple">
            Terms of Service
          </Link>
        </div>
        <p className="text-pixel-mid text-xs">
          © 2026 STREET PIXEL WARS. ALL RIGHTS RESERVED.
        </p>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;