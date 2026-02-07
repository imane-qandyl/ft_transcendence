/**
 * Preload Scene - Load all game assets
 */

import Phaser from 'phaser';
import { PixelArtGenerator } from '../utils/pixelArtGenerator';

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload() {
    // Create loading bar
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

    const loadingText = this.make.text({
      x: width / 2,
      y: height / 2 - 50,
      text: 'Loading Street Pixel Wars...',
      style: {
        font: '20px monospace',
        fill: '#ffffff'
      }
    });
    loadingText.setOrigin(0.5, 0.5);

    const percentText = this.make.text({
      x: width / 2,
      y: height / 2,
      text: '0%',
      style: {
        font: '18px monospace',
        fill: '#ffffff'
      }
    });
    percentText.setOrigin(0.5, 0.5);

    // Update progress bar
    this.load.on('progress', (value) => {
      percentText.setText(parseInt(value * 100) + '%');
      progressBar.clear();
      progressBar.fillStyle(0x4ecca3, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
    });

    this.load.on('loaderror', (file) => {
      console.error('❌ Error loading file:', file.key, file.url);
    });

    this.load.on('filecomplete', (key) => {
      console.log('✅ Loaded:', key);
    });

    // Generate pixel art sprites programmatically
    this.generatePixelArt();
  }

  generatePixelArt() {
    // Load actual character sprite sheets (32x32 per frame)
    console.log('🎨 Loading character sprites...');

    // Pink Monster - Player 1
    this.load.spritesheet('pink_idle', '/assets/sprites/pink_idle.png', {
      frameWidth: 32,
      frameHeight: 32
    });
    this.load.spritesheet('pink_walk', '/assets/sprites/pink_walk.png', {
      frameWidth: 32,
      frameHeight: 32
    });
    this.load.spritesheet('pink_attack', '/assets/sprites/pink_attack.png', {
      frameWidth: 32,
      frameHeight: 32
    });

    // Owlet Monster - Player 2
    this.load.spritesheet('owlet_idle', '/assets/sprites/owlet_idle.png', {
      frameWidth: 32,
      frameHeight: 32
    });
    this.load.spritesheet('owlet_walk', '/assets/sprites/owlet_walk.png', {
      frameWidth: 32,
      frameHeight: 32
    });
    this.load.spritesheet('owlet_attack', '/assets/sprites/owlet_attack.png', {
      frameWidth: 32,
      frameHeight: 32
    });

    // Dude Monster - Player 3 (for variety)
    this.load.spritesheet('dude_idle', '/assets/sprites/dude_idle.png', {
      frameWidth: 32,
      frameHeight: 32
    });
    this.load.spritesheet('dude_walk', '/assets/sprites/dude_walk.png', {
      frameWidth: 32,
      frameHeight: 32
    });
    this.load.spritesheet('dude_attack', '/assets/sprites/dude_attack.png', {
      frameWidth: 32,
      frameHeight: 32
    });

    // Warrior (New character - larger sprites 96x96)
    this.load.spritesheet('warrior_idle', '/assets/sprites/warrior_idle.png', {
      frameWidth: 96,
      frameHeight: 96
    });
    this.load.spritesheet('warrior_walk', '/assets/sprites/warrior_walk.png', {
      frameWidth: 96,
      frameHeight: 96
    });
    this.load.spritesheet('warrior_attack', '/assets/sprites/warrior_attack.png', {
      frameWidth: 96,
      frameHeight: 96
    });

    // Mage (New character - larger sprites 96x96)
    this.load.spritesheet('mage_idle', '/assets/sprites/mage_idle.png', {
      frameWidth: 96,
      frameHeight: 96
    });
    this.load.spritesheet('mage_walk', '/assets/sprites/mage_walk.png', {
      frameWidth: 96,
      frameHeight: 96
    });
    this.load.spritesheet('mage_attack', '/assets/sprites/mage_attack.png', {
      frameWidth: 96,
      frameHeight: 96
    });

    // Rogue (New character - larger sprites 96x96)
    this.load.spritesheet('rogue_idle', '/assets/sprites/rogue_idle.png', {
      frameWidth: 96,
      frameHeight: 96
    });
    this.load.spritesheet('rogue_walk', '/assets/sprites/rogue_walk.png', {
      frameWidth: 96,
      frameHeight: 96
    });
    this.load.spritesheet('rogue_attack', '/assets/sprites/rogue_attack.png', {
      frameWidth: 96,
      frameHeight: 96
    });

    // Load battle backgrounds
    this.load.image('bg_mountains', '/assets/backgrounds/mountains.jpg');
    this.load.image('bg_camp', '/assets/backgrounds/camp.jpg');
    this.load.image('bg_desert', '/assets/backgrounds/desert.jpg');

    // Generate arena background (keep the generated one as fallback)
    const arenaSprite = PixelArtGenerator.createStreetArena(800, 600);
    this.textures.addBase64('arena_street', arenaSprite);
  }

  create() {
    // Create animations for all characters
    console.log('🎬 Creating animations...');
    console.log('Available textures:', Object.keys(this.textures.list));
    
    // Check if textures were loaded properly
    const pinkTexture = this.textures.get('pink_idle');
    console.log('Pink idle texture:', pinkTexture);
    console.log('Pink idle frames:', pinkTexture.frameTotal);

    // Helper function to safely create animation
    const safeCreateAnim = (key, textureKey, frameStart, frameEnd, frameRate, repeat) => {
      // Skip if animation already exists
      if (this.anims.exists(key)) {
        console.log(`Animation ${key} already exists, skipping...`);
        return;
      }
      
      // Check if texture exists
      if (!this.textures.exists(textureKey)) {
        console.warn(`Texture ${textureKey} not found, skipping animation ${key}`);
        return;
      }

      try {
        this.anims.create({
          key: key,
          frames: this.anims.generateFrameNumbers(textureKey, { start: frameStart, end: frameEnd }),
          frameRate: frameRate,
          repeat: repeat
        });
        console.log(`✅ Created animation: ${key}`);
      } catch (error) {
        console.warn(`Failed to create animation ${key}:`, error);
      }
    };

    // Pink Monster animations
    safeCreateAnim('pink_idle_anim', 'pink_idle', 0, 3, 8, -1);
    safeCreateAnim('pink_walk_anim', 'pink_walk', 0, 5, 10, -1);
    safeCreateAnim('pink_attack_anim', 'pink_attack', 0, 3, 12, 0);

    // Owlet Monster animations
    safeCreateAnim('owlet_idle_anim', 'owlet_idle', 0, 3, 8, -1);
    safeCreateAnim('owlet_walk_anim', 'owlet_walk', 0, 5, 10, -1);
    safeCreateAnim('owlet_attack_anim', 'owlet_attack', 0, 3, 12, 0);

    // Dude Monster animations
    safeCreateAnim('dude_idle_anim', 'dude_idle', 0, 3, 8, -1);
    safeCreateAnim('dude_walk_anim', 'dude_walk', 0, 5, 10, -1);
    safeCreateAnim('dude_attack_anim', 'dude_attack', 0, 3, 12, 0);

    // Warrior animations (new character - 96x96)
    safeCreateAnim('warrior_idle_anim', 'warrior_idle', 0, 3, 8, -1);
    safeCreateAnim('warrior_walk_anim', 'warrior_walk', 0, 5, 10, -1);
    safeCreateAnim('warrior_attack_anim', 'warrior_attack', 0, 5, 12, 0);

    // Mage animations (new character - 96x96)
    safeCreateAnim('mage_idle_anim', 'mage_idle', 0, 3, 8, -1);
    safeCreateAnim('mage_walk_anim', 'mage_walk', 0, 5, 10, -1);
    safeCreateAnim('mage_attack_anim', 'mage_attack', 0, 5, 12, 0);

    // Rogue animations (new character - 96x96)
    safeCreateAnim('rogue_idle_anim', 'rogue_idle', 0, 3, 8, -1);
    safeCreateAnim('rogue_walk_anim', 'rogue_walk', 0, 5, 10, -1);
    safeCreateAnim('rogue_attack_anim', 'rogue_attack', 0, 5, 12, 0);

    // Log all created animations
    const animKeys = Object.keys(this.anims.anims.entries);
    console.log('✅ All animations created successfully!', animKeys);
    
    // Get battle data from global window object
    const battleData = window.__BATTLE_DATA__;
    if (battleData) {
      this.scene.start('BattleScene', battleData);
    } else {
      console.warn('⚠️ No battle data found');
      this.scene.start('BattleScene');
    }
  }
}
