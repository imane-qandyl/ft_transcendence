/**
 * Pixel Art Generator for Street Pixel Wars
 * Generates simple pixel art sprites programmatically
 */

export class PixelArtGenerator {
  /**
   * Create a gangster character sprite
   * @param {string} color - Primary color (#RRGGBB)
   * @param {number} width - Sprite width
   * @param {number} height - Sprite height
   * @returns {string} - Data URL of generated sprite
   */
  static createGangsterSprite(color, width = 16, height = 24) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Convert hex to RGB
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);

    // Darker shade for outlines
    const darkColor = `rgb(${Math.floor(r * 0.5)}, ${Math.floor(g * 0.5)}, ${Math.floor(b * 0.5)})`;
    const mainColor = color;
    const lightColor = `rgb(${Math.min(r + 40, 255)}, ${Math.min(g + 40, 255)}, ${Math.min(b + 40, 255)})`;

    const skinColor = '#ffcc99';
    const hairColor = '#333333';
    const shirtColor = mainColor;

    // Draw pixel by pixel (simplified gangster)
    const pixels = [
      // Head (rows 0-7)
      [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0], // 0 - top of hair
      [0,0,0,1,1,2,2,2,2,2,2,1,1,0,0,0], // 1 - hair
      [0,0,1,2,2,2,2,2,2,2,2,2,2,1,0,0], // 2 - hair
      [0,1,2,2,3,3,3,3,3,3,3,3,2,2,1,0], // 3 - forehead
      [0,1,2,3,3,1,3,3,3,3,1,3,3,2,1,0], // 4 - eyes
      [0,1,2,3,3,3,3,4,4,3,3,3,3,2,1,0], // 5 - nose
      [0,1,2,3,3,3,4,4,4,4,3,3,3,2,1,0], // 6 - mouth
      [0,0,1,3,3,3,3,3,3,3,3,3,3,1,0,0], // 7 - chin

      // Body (rows 8-15)
      [0,0,1,1,3,3,3,3,3,3,3,3,1,1,0,0], // 8 - neck
      [0,1,5,5,5,5,5,5,5,5,5,5,5,5,1,0], // 9 - shoulders
      [1,5,5,5,5,6,6,6,6,6,6,5,5,5,5,1], // 10 - chest
      [1,5,5,5,6,6,6,6,6,6,6,6,5,5,5,1], // 11
      [1,5,5,5,6,6,6,6,6,6,6,6,5,5,5,1], // 12
      [0,1,5,5,6,6,6,6,6,6,6,6,5,5,1,0], // 13
      [0,0,1,5,5,6,6,6,6,6,6,5,5,1,0,0], // 14
      [0,0,1,5,5,5,5,5,5,5,5,5,5,1,0,0], // 15

      // Legs (rows 16-23)
      [0,0,1,5,5,5,1,1,1,1,5,5,5,1,0,0], // 16
      [0,0,1,5,5,1,0,0,0,0,1,5,5,1,0,0], // 17
      [0,0,1,5,5,1,0,0,0,0,1,5,5,1,0,0], // 18
      [0,0,1,5,5,1,0,0,0,0,1,5,5,1,0,0], // 19
      [0,0,1,5,5,1,0,0,0,0,1,5,5,1,0,0], // 20
      [0,0,1,5,5,1,0,0,0,0,1,5,5,1,0,0], // 21
      [0,0,1,5,5,1,0,0,0,0,1,5,5,1,0,0], // 22
      [0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0], // 23 - feet
    ];

    const colorMap = {
      0: 'transparent',
      1: darkColor,
      2: hairColor,
      3: skinColor,
      4: '#ff6b6b', // mouth
      5: shirtColor,
      6: lightColor
    };

    // Draw pixels
    for (let y = 0; y < pixels.length; y++) {
      for (let x = 0; x < pixels[y].length; x++) {
        const colorIndex = pixels[y][x];
        const pixelColor = colorMap[colorIndex];

        if (pixelColor && pixelColor !== 'transparent') {
          ctx.fillStyle = pixelColor;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }

    return canvas.toDataURL();
  }

  /**
   * Create a weapon sprite
   * @param {string} weaponType - 'knife', 'bat', 'katana', 'pistol'
   * @returns {string} - Data URL
   */
  static createWeaponSprite(weaponType) {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');

    const weapons = {
      knife: [
        [0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,1,2,1,0,0],
        [0,0,0,0,0,0,0,0,0,0,1,2,2,2,1,0],
        [0,0,0,0,0,0,0,0,0,1,2,2,2,1,0,0],
        [0,0,0,0,0,0,0,0,1,2,2,2,1,0,0,0],
        [0,0,0,0,0,0,0,1,2,2,2,1,0,0,0,0],
        [0,0,0,0,0,0,1,2,2,2,1,0,0,0,0,0],
        [0,0,0,0,0,1,2,2,2,1,0,0,0,0,0,0],
        [0,0,0,0,1,2,2,2,1,0,0,0,0,0,0,0],
        [0,0,0,1,2,2,2,1,0,0,0,0,0,0,0,0],
        [0,0,1,2,2,2,1,0,0,0,0,0,0,0,0,0],
        [0,1,2,2,2,1,0,0,0,0,0,0,0,0,0,0],
        [1,2,2,2,1,0,0,0,0,0,0,0,0,0,0,0],
        [0,1,1,1,3,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      ],
      bat: [
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0],
        [0,0,0,0,0,0,0,0,0,0,1,1,2,2,1,0],
        [0,0,0,0,0,0,0,1,1,1,2,2,2,1,0,0],
        [0,0,0,0,1,1,1,2,2,2,2,2,1,0,0,0],
        [0,0,1,1,2,2,2,2,2,2,2,1,0,0,0,0],
        [0,1,2,2,2,2,2,2,2,2,1,0,0,0,0,0],
        [1,2,2,2,2,2,2,2,2,1,0,0,0,0,0,0],
        [1,2,2,2,2,2,2,2,1,0,0,0,0,0,0,0],
        [0,1,2,2,2,2,2,1,0,0,0,0,0,0,0,0],
        [0,0,1,2,2,2,1,0,0,0,0,0,0,0,0,0],
        [0,0,0,1,2,1,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,1,3,3,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,3,3,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      ],
      pistol: [
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0],
        [0,0,0,0,1,2,2,2,2,2,1,1,1,0,0,0],
        [0,0,0,0,1,2,2,2,2,2,2,2,2,1,0,0],
        [0,1,1,1,1,2,2,2,2,2,2,2,2,1,0,0],
        [1,2,2,2,2,2,2,2,2,2,2,2,2,1,0,0],
        [1,2,2,2,2,2,2,2,2,2,2,2,1,0,0,0],
        [1,2,2,2,2,2,2,2,2,2,2,2,1,0,0,0],
        [0,1,2,2,2,2,2,2,2,1,1,1,0,0,0,0],
        [0,0,1,2,2,2,2,2,2,1,0,0,0,0,0,0],
        [0,0,1,2,2,2,2,2,2,1,0,0,0,0,0,0],
        [0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      ]
    };

    const colorMaps = {
      knife: {
        0: 'transparent',
        1: '#555555',
        2: '#cccccc',
        3: '#8B4513'
      },
      bat: {
        0: 'transparent',
        1: '#4a3020',
        2: '#8B6F47',
        3: '#000000'
      },
      pistol: {
        0: 'transparent',
        1: '#333333',
        2: '#FFD700'
      }
    };

    const weaponData = weapons[weaponType] || weapons.knife;
    const colorMap = colorMaps[weaponType] || colorMaps.knife;

    for (let y = 0; y < weaponData.length; y++) {
      for (let x = 0; x < weaponData[y].length; x++) {
        const colorIndex = weaponData[y][x];
        const color = colorMap[colorIndex];

        if (color && color !== 'transparent') {
          ctx.fillStyle = color;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }

    return canvas.toDataURL();
  }

  /**
   * Create a simple street arena background
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   * @returns {string} - Data URL
   */
  static createStreetArena(width = 800, height = 600) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Sky
    const skyGradient = ctx.createLinearGradient(0, 0, 0, height * 0.6);
    skyGradient.addColorStop(0, '#1a1a2e');
    skyGradient.addColorStop(1, '#2d2d40');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, width, height * 0.6);

    // Buildings (simplified)
    ctx.fillStyle = '#16213e';
    ctx.fillRect(0, height * 0.3, width * 0.3, height * 0.3);
    ctx.fillRect(width * 0.35, height * 0.2, width * 0.3, height * 0.4);
    ctx.fillRect(width * 0.7, height * 0.35, width * 0.3, height * 0.25);

    // Windows
    ctx.fillStyle = '#ffdd00';
    for (let x = 20; x < width * 0.3; x += 40) {
      for (let y = height * 0.35; y < height * 0.55; y += 30) {
        ctx.fillRect(x, y, 15, 20);
      }
    }

    // Street floor
    ctx.fillStyle = '#4a4a4a';
    ctx.fillRect(0, height * 0.6, width, height * 0.4);

    // Floor lines
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 2;
    for (let y = height * 0.6; y < height; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Graffiti effect
    ctx.fillStyle = '#ee5a6f';
    ctx.font = 'bold 48px Arial';
    ctx.globalAlpha = 0.3;
    ctx.fillText('FIGHT!', 50, height * 0.45);
    ctx.globalAlpha = 1.0;

    return canvas.toDataURL();
  }
}
