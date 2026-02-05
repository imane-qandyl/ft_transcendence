/**
 * Settings Page - Game info and help
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const navigate = useNavigate();

  return (
    <div className="h-full p-4 overflow-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="text-retro-purple text-lg mb-2">[?] SETTINGS</div>
        <div className="text-pixel-light text-xs">GAME INFO & HELP</div>
      </div>

      {/* About the Game */}
      <div className="pixel-card p-4 mb-4">
        <div className="text-retro-purple text-xs mb-3">-- ABOUT --</div>
        <div className="text-pixel-white text-xs leading-relaxed space-y-2">
          <p>
            STREET PIXEL WARS IS A TURN-BASED
            COMBAT GAME WITH PIXEL GRAPHICS.
          </p>
          <p>
            BATTLE YOUR FRIENDS ON LAN OR
            FIND OPPONENTS ONLINE.
          </p>
        </div>
      </div>

      {/* How to Play */}
      <div className="pixel-card p-4 mb-4">
        <div className="text-retro-purple text-xs mb-3">-- HOW TO PLAY --</div>
        <div className="space-y-3">
          <HelpItem
            step="1"
            title="CREATE CHARACTER"
            desc="CHOOSE A NAME AND FIGHTER"
          />
          <HelpItem
            step="2"
            title="FIND A MATCH"
            desc="CLICK PLAY TO ENTER QUEUE"
          />
          <HelpItem
            step="3"
            title="BATTLE"
            desc="TAKE TURNS ATTACKING YOUR ENEMY"
          />
          <HelpItem
            step="4"
            title="WIN REWARDS"
            desc="EARN XP, COINS AND ELO"
          />
        </div>
      </div>

      {/* Combat Guide */}
      <div className="pixel-card p-4 mb-4">
        <div className="text-retro-purple text-xs mb-3">-- COMBAT --</div>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-retro-red">[ATK]</span>
            <span className="text-pixel-light">BASIC ATTACK</span>
          </div>
          <div className="flex justify-between">
            <span className="text-retro-blue">[DEF]</span>
            <span className="text-pixel-light">REDUCE DAMAGE</span>
          </div>
          <div className="flex justify-between">
            <span className="text-retro-green">[HEAL]</span>
            <span className="text-pixel-light">RESTORE HP</span>
          </div>
          <div className="flex justify-between">
            <span className="text-retro-yellow">[SPECIAL]</span>
            <span className="text-pixel-light">POWERFUL SKILL</span>
          </div>
        </div>
      </div>

      {/* Stats Explained */}
      <div className="pixel-card p-4 mb-4">
        <div className="text-retro-purple text-xs mb-3">-- STATS --</div>
        <div className="space-y-2 text-xs">
          <StatInfo name="HEALTH" desc="YOUR TOTAL HP" />
          <StatInfo name="ATTACK" desc="DAMAGE DEALT" />
          <StatInfo name="DEFENSE" desc="DAMAGE REDUCED" />
          <StatInfo name="CRIT" desc="CHANCE FOR 2X DMG" />
          <StatInfo name="LUCK" desc="BONUS REWARDS" />
        </div>
      </div>

      {/* Ranking System */}
      <div className="pixel-card p-4 mb-4">
        <div className="text-retro-purple text-xs mb-3">-- ELO RANKING --</div>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-pixel-mid">BRONZE</span>
            <span className="text-pixel-light">0 - 999</span>
          </div>
          <div className="flex justify-between">
            <span className="text-pixel-white">SILVER</span>
            <span className="text-pixel-light">1000 - 1499</span>
          </div>
          <div className="flex justify-between">
            <span className="text-retro-yellow">GOLD</span>
            <span className="text-pixel-light">1500 - 1999</span>
          </div>
          <div className="flex justify-between">
            <span className="text-retro-purple">DIAMOND</span>
            <span className="text-pixel-light">2000+</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="pixel-card p-4 mb-4">
        <div className="text-retro-purple text-xs mb-3">-- CONTROLS --</div>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-retro-purple">[MOUSE]</span>
            <span className="text-pixel-light">SELECT ACTION</span>
          </div>
          <div className="flex justify-between">
            <span className="text-retro-purple">[ESC]</span>
            <span className="text-pixel-light">MENU / CANCEL</span>
          </div>
        </div>
      </div>

      {/* Credits */}
      <div className="pixel-card p-4 mb-4">
        <div className="text-retro-purple text-xs mb-3">-- CREDITS --</div>
        <div className="text-center text-pixel-light text-xs space-y-1">
          <p>FT_TRANSCENDENCE</p>
          <p>42 PROJECT</p>
          <p className="text-pixel-mid mt-2">MADE WITH REACT + PHASER</p>
        </div>
      </div>

      {/* Version */}
      <div className="text-center text-pixel-mid text-[8px] mb-4">
        VERSION 1.0.0
      </div>

      {/* Back Button */}
      <button
        onClick={() => navigate('/play')}
        className="pixel-btn w-full text-xs"
      >
        {'<'} BACK TO GAME
      </button>
    </div>
  );
};

const HelpItem = ({ step, title, desc }) => (
  <div className="flex gap-3">
    <div className="w-6 h-6 bg-retro-purple border-2 border-retro-purple text-pixel-black text-xs flex items-center justify-center shrink-0">
      {step}
    </div>
    <div>
      <div className="text-pixel-white text-xs">{title}</div>
      <div className="text-pixel-mid text-[8px]">{desc}</div>
    </div>
  </div>
);

const StatInfo = ({ name, desc }) => (
  <div className="flex justify-between">
    <span className="text-retro-purple">{name}</span>
    <span className="text-pixel-light">{desc}</span>
  </div>
);

export default Settings;
