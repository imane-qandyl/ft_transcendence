/**
 * Terms of Service Page
 */

import React from 'react';
import { Link } from 'react-router-dom';

const TermsOfService = () => {
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
              TERMS OF SERVICE
            </h1>
            
            <div className="text-pixel-light text-sm space-y-6">
              <div>
                <h2 className="text-retro-green text-base mb-3">ACCEPTANCE OF TERMS</h2>
                <p>
                  By accessing and using Street Pixel Wars ("the Game" or "Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.
                </p>
              </div>

              <div>
                <h2 className="text-retro-green text-base mb-3">GAME DESCRIPTION</h2>
                <p>
                  Street Pixel Wars is a turn-based combat multiplayer web game featuring character progression, real-time chat, friend systems, and competitive gameplay. The game supports multiple users simultaneously with real-time updates.
                </p>
              </div>

              <div>
                <h2 className="text-retro-green text-base mb-3">USER ACCOUNTS</h2>
                <p className="mb-2">
                  To use the Service, you must:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Be at least 13 years of age</li>
                  <li>Provide accurate and complete registration information</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>Accept responsibility for all activities under your account</li>
                  <li>Notify us immediately of any unauthorized use of your account</li>
                </ul>
              </div>

              <div>
                <h2 className="text-retro-green text-base mb-3">ACCEPTABLE USE POLICY</h2>
                <p className="mb-2">
                  You agree NOT to:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Use cheats, exploits, automation software, bots, or unauthorized third-party tools</li>
                  <li>Harass, bully, threaten, or abuse other users</li>
                  <li>Share inappropriate, offensive, or illegal content</li>
                  <li>Attempt to gain unauthorized access to the game systems</li>
                  <li>Impersonate other users or create fake accounts</li>
                  <li>Engage in real money trading of game items or accounts</li>
                  <li>Disrupt gameplay or server functionality</li>
                  <li>Violate any applicable laws or regulations</li>
                </ul>
              </div>

              <div>
                <h2 className="text-retro-green text-base mb-3">VIRTUAL ITEMS AND CURRENCY</h2>
                <p>
                  Any virtual items, currency, or progression gained in the game have no real-world value and cannot be exchanged for real money. We reserve the right to modify, suspend, or remove virtual items at our discretion.
                </p>
              </div>

              <div>
                <h2 className="text-retro-green text-base mb-3">INTELLECTUAL PROPERTY</h2>
                <p>
                  All content in Street Pixel Wars, including graphics, music, text, and code, is owned by us or our licensors. You may not copy, modify, distribute, or create derivative works from our content without explicit permission.
                </p>
              </div>

              <div>
                <h2 className="text-retro-green text-base mb-3">USER-GENERATED CONTENT</h2>
                <p>
                  By submitting content (chat messages, usernames, etc.), you grant us a non-exclusive license to use, display, and distribute that content within the game. You retain ownership but are responsible for ensuring your content doesn't violate these terms.
                </p>
              </div>

              <div>
                <h2 className="text-retro-green text-base mb-3">PRIVACY</h2>
                <p>
                  Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your information when you use our Service.
                </p>
              </div>

              <div>
                <h2 className="text-retro-green text-base mb-3">SERVICE AVAILABILITY</h2>
                <p>
                  We strive to maintain service availability but cannot guarantee uninterrupted access. We may temporarily suspend service for maintenance, updates, or to address technical issues. We are not liable for any loss or inconvenience caused by service interruptions.
                </p>
              </div>

              <div>
                <h2 className="text-retro-green text-base mb-3">ENFORCEMENT AND PENALTIES</h2>
                <p className="mb-2">
                  Violations of these terms may result in:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Warning notifications</li>
                  <li>Temporary account suspension</li>
                  <li>Permanent account termination</li>
                  <li>Loss of virtual items and progress</li>
                  <li>IP address banning</li>
                </ul>
              </div>

              <div>
                <h2 className="text-retro-green text-base mb-3">LIMITATION OF LIABILITY</h2>
                <p>
                  Street Pixel Wars is provided "as is" without warranties. We are not liable for any indirect, incidental, special, or consequential damages arising from your use of the Service, including loss of data, profits, or gameplay progress.
                </p>
              </div>

              <div>
                <h2 className="text-retro-green text-base mb-3">INDEMNIFICATION</h2>
                <p>
                  You agree to indemnify and hold us harmless from any claims, damages, or expenses arising from your use of the Service, violation of these terms, or infringement of any third-party rights.
                </p>
              </div>

              <div>
                <h2 className="text-retro-green text-base mb-3">MODIFICATIONS TO TERMS</h2>
                <p>
                  We may update these Terms of Service at any time. Significant changes will be communicated through in-game notifications or email. Continued use of the Service after changes constitutes acceptance of the updated terms.
                </p>
              </div>

              <div>
                <h2 className="text-retro-green text-base mb-3">TERMINATION</h2>
                <p>
                  Either party may terminate this agreement at any time. Upon termination, your access to the Service will cease, and any data associated with your account may be deleted.
                </p>
              </div>

              <div>
                <h2 className="text-retro-green text-base mb-3">GOVERNING LAW</h2>
                <p>
                  These terms are governed by applicable local laws. Any disputes will be resolved through binding arbitration or in the appropriate court jurisdiction.
                </p>
              </div>

              <div>
                <h2 className="text-retro-green text-base mb-3">CONTACT INFORMATION</h2>
                <p>
                  For questions about these Terms of Service, please contact us at legal@streetpixelwars.com
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

export default TermsOfService;