import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-pixel-black flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        {/* Pixel Art Title */}
        <div className="text-center mb-8 sm:mb-12">
          {/* Sword Icon */}
          <div className="text-4xl sm:text-5xl md:text-6xl mb-4 sm:mb-6">
            [=====&gt;
          </div>

          {/* Title */}
          <h1 className="text-xl sm:text-2xl text-retro-purple mb-3 sm:mb-4 tracking-wide px-4">
            STREET PIXEL WARS
          </h1>

          {/* Subtitle */}
          <p className="text-pixel-light text-xs sm:text-sm mb-2">
            * TURN-BASED COMBAT *
          </p>
          <p className="text-pixel-light text-xs sm:text-sm">
            * PIXEL GRAPHICS * LAN PLAY *
          </p>
        </div>

        {/* Menu Box */}
        <div className="pixel-card w-full max-w-sm mx-4 sm:max-w-md">
          {/* Decorative top border */}
          <div className="text-center text-pixel-light mb-4 sm:mb-6 text-xs">
            +-----------------------+
          </div>

          {user ? (
            <div className="space-y-4">
              <p className="text-center text-retro-green text-xs mb-6">
                WELCOME BACK, {user.username?.toUpperCase()}!
              </p>
              <Link
                to="/play"
                className="pixel-btn pixel-btn-primary w-full block text-center text-xs"
              >
                &gt; ENTER GAME &lt;
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <Link
                to="/register"
                className="pixel-btn pixel-btn-primary w-full block text-center text-xs"
              >
                &gt; NEW GAME &lt;
              </Link>
              <Link
                to="/login"
                className="pixel-btn w-full block text-center text-xs"
              >
                &gt; CONTINUE &lt;
              </Link>
            </div>
          )}

          {/* Decorative bottom border */}
          <div className="text-center text-pixel-light mt-6 text-xs">
            +-----------------------+
          </div>
        </div>

        {/* Features */}
        <div className="mt-12 grid grid-cols-3 gap-8 max-w-lg">
          <FeatureItem icon="[!]" label="COMBAT" />
          <FeatureItem icon="[+]" label="FRIENDS" />
          <FeatureItem icon="[*]" label="RANKS" />
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 text-center border-t-3 border-pixel-mid">
        <p className="text-pixel-light text-xs">
          FT_TRANSCENDENCE // 42 PROJECT
        </p>
        <p className="text-pixel-mid text-xs mt-1">
          PRESS START
        </p>
      </footer>
    </div>
  );
};

const FeatureItem = ({ icon, label }) => (
  <div className="text-center">
    <div className="text-retro-purple text-lg mb-2">{icon}</div>
    <div className="text-pixel-light text-xs">{label}</div>
  </div>
);

export default Home;
