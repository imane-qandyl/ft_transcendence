/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        // Retro pixel art palette - limited colors
        'pixel': {
          'black': '#0f0f1b',
          'dark': '#1a1a2e',
          'mid': '#2d2d44',
          'light': '#4a4a68',
          'white': '#c8c8d4',
        },
        'retro': {
          'purple': '#9b5de5',
          'pink': '#f15bb5',
          'blue': '#00bbf9',
          'green': '#00f5d4',
          'yellow': '#fee440',
          'red': '#ff6b6b',
          'orange': '#ffa94d',
        },
        // Keep some game colors for compatibility
        'game': {
          'bg': '#0f0f1b',
          'dark': '#1a1a2e',
          'card': '#2d2d44',
          'border': '#4a4a68',
          'hover': '#3d3d5c',
        },
        'accent': {
          'primary': '#9b5de5',
          'secondary': '#f15bb5',
        },
        'status': {
          'online': '#00f5d4',
          'offline': '#4a4a68',
          'ingame': '#fee440',
        },
        'game-red': '#ff6b6b',
        'game-green': '#00f5d4',
        'game-gold': '#fee440',
      },
      fontFamily: {
        'pixel': ['"Press Start 2P"', 'monospace'],
        'game': ['"Press Start 2P"', 'monospace'],
      },
      boxShadow: {
        'pixel': '4px 4px 0px #0f0f1b',
        'pixel-sm': '2px 2px 0px #0f0f1b',
        'pixel-purple': '4px 4px 0px #9b5de5',
      },
      borderWidth: {
        '3': '3px',
      },
    },
  },
  plugins: [],
}
