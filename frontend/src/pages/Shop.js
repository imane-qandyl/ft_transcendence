import React from 'react';

const Shop = () => {
  return (
    <div className="min-h-screen bg-pixel-black p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-retro-purple text-xs mb-2">{'>'} ITEM MARKETPLACE {'<'}</div>
          <h1 className="text-2xl text-pixel-white mb-2">SHOP</h1>
          <div className="text-pixel-light text-xs">EQUIP YOUR FIGHTER</div>
        </div>

        {/* Coming Soon Content */}
        <div className="pixel-card p-12">
          <div className="text-center">
            {/* Icon */}
            <div className="text-8xl mb-6">🛒</div>

            {/* Main Message */}
            <div className="mb-6">
              <div className="text-retro-yellow text-xl mb-3">COMING SOON</div>
              <div className="text-pixel-white text-sm mb-2">SHOP UNDER CONSTRUCTION</div>
            </div>

            {/* Divider */}
            <div className="flex items-center justify-center my-6">
              <div className="border-t border-pixel-mid flex-1"></div>
              <div className="px-4 text-pixel-light text-xs">⚒️</div>
              <div className="border-t border-pixel-mid flex-1"></div>
            </div>

            {/* Future Features */}
            <div className="pixel-card bg-pixel-dark p-6 max-w-md mx-auto">
              <div className="text-retro-blue text-xs mb-4">PLANNED FEATURES:</div>
              <div className="text-left space-y-3 text-pixel-light text-xs">
                <div className="flex items-start">
                  <span className="text-retro-pink mr-2">▸</span>
                  <span>Character skins and customization</span>
                </div>
                <div className="flex items-start">
                  <span className="text-retro-pink mr-2">▸</span>
                  <span>Special abilities and power-ups</span>
                </div>
                <div className="flex items-start">
                  <span className="text-retro-pink mr-2">▸</span>
                  <span>Exclusive weapons and gear</span>
                </div>
                <div className="flex items-start">
                  <span className="text-retro-pink mr-2">▸</span>
                  <span>Victory emotes and taunts</span>
                </div>
                <div className="flex items-start">
                  <span className="text-retro-pink mr-2">▸</span>
                  <span>Profile badges and titles</span>
                </div>
              </div>
            </div>

            {/* Bottom Message */}
            <div className="mt-8 text-pixel-light text-xs">
              <div className="mb-2">💰 EARN COINS BY WINNING BATTLES 💰</div>
              <div className="text-pixel-mid">Stay tuned for updates!</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shop;
