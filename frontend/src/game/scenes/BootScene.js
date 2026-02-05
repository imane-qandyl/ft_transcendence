/**
 * Boot Scene - Initial setup
 */

import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Load any assets needed for the preloader
    // For now, just move to preload scene
  }

  create() {
    this.scene.start('PreloadScene');
  }
}
