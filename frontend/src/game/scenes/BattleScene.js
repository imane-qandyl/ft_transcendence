/**
 * Battle Scene - Main PvP combat scene
 */

import Phaser from 'phaser';

export default class BattleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BattleScene' });
    this.socket = null;
    this.matchId = null;
    this.gameState = null;
    this.myCharacterId = null;
    this.myUserId = null;
    this.isMyTurn = false;
    this.isDestroyed = false; // Track if scene is destroyed
  }

  init(data) {
    // Reset destroyed flag
    this.isDestroyed = false;
    
    // Receive socket and match data from React component
    // First try from passed data, then fall back to global window object
    const battleData = data?.socket ? data : window.__BATTLE_DATA__;
    
    if (!battleData) {
      console.error('No battle data available!');
      return;
    }
    
    this.socket = battleData.socket;
    this.matchId = battleData.matchId;
    this.gameState = battleData.initialState;
    this.myCharacterId = battleData.myCharacterId;
    this.myUserId = battleData.myUserId;
    this.isMyTurn = battleData.isYourTurn || false;
    this.gameEnded = false; // Track if game has ended
    

    console.log('  - My Turn:', this.isMyTurn);
    console.log('  - My Character ID:', this.myCharacterId);
    console.log('  - My User ID:', this.myUserId);
    
    if (this.socket) {
      this.setupSocketListeners();
    } else {
      console.error('❌ Socket is null after init!');
    }
  }

  create() {

    
    // Safety check - if no game state, we can't continue
    if (!this.gameState) {
      console.error('❌ No game state in create()!');
      return;
    }
    
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Available backgrounds - select based on matchId so both players see the same one
    const backgrounds = ['bg_mountains', 'bg_camp', 'bg_desert', 'arena_street'];
    
    // Use matchId as seed for consistent background selection between players
    // Convert matchId to a number by summing character codes
    let seed = 0;
    if (this.matchId) {
      for (let i = 0; i < this.matchId.length; i++) {
        seed += this.matchId.charCodeAt(i);
      }
    }
    const backgroundIndex = seed % backgrounds.length;
    const selectedBg = backgrounds[backgroundIndex];
    
    // Background - use the selected background (same for both players)
    const bgImage = this.add.image(width / 2, height / 2, selectedBg);
    // Scale to fit the screen
    bgImage.setDisplaySize(width, height);
    bgImage.setOrigin(0.5);
    
    // Darken the background so characters stand out more
    bgImage.setTint(0x666666); // Darken by ~60%
    
    // Add a dark overlay for better character visibility
    const darkOverlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.35);
    darkOverlay.setOrigin(0.5);
    
    // Add a ground/platform area at the bottom for characters to stand on
    const groundY = height - 100;
    const ground = this.add.rectangle(width / 2, groundY + 50, width, 100, 0x1a1a2e, 0.8);
    ground.setOrigin(0.5, 0);

    // --- Fullscreen Button (top-right corner) ---
    const fsBtnSize = 44;
    const fsBtnMargin = 15;
    const fsBtnX = width - fsBtnSize / 2 - fsBtnMargin;
    const fsBtnY = fsBtnSize / 2 + fsBtnMargin;

    const fsBg = this.add.rectangle(fsBtnX, fsBtnY, fsBtnSize, fsBtnSize, 0x222831, 0.9)
      .setStrokeStyle(2, 0x4ecca3)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setDepth(1000);

    // Fullscreen icon text (using simple characters that work everywhere)
    this.fsLabel = this.add.text(fsBtnX, fsBtnY, '[ ]', {
      font: 'bold 18px monospace',
      fill: '#4ecca3',
      align: 'center',
    }).setOrigin(0.5).setDepth(1001);

    // Update icon based on fullscreen state
    const updateFSIcon = () => {
      if (this.scale.isFullscreen) {
        this.fsLabel.setText('[X]');
      } else {
        this.fsLabel.setText('[ ]');
      }
    };

    // Listen for fullscreen change using Phaser's scale manager
    this.scale.on('enterfullscreen', updateFSIcon);
    this.scale.on('leavefullscreen', updateFSIcon);

    fsBg.on('pointerdown', () => {
      if (this.scale.isFullscreen) {
        this.scale.stopFullscreen();
      } else {
        this.scale.startFullscreen();
      }
    });

    fsBg.on('pointerover', () => {
      fsBg.setFillStyle(0x4ecca3, 0.3);
      this.fsLabel.setColor('#ffffff');
    });
    fsBg.on('pointerout', () => {
      fsBg.setFillStyle(0x222831, 0.9);
      this.fsLabel.setColor('#4ecca3');
    });

    // Set initial icon
    updateFSIcon();

    // Add ground border
    const groundBorder = this.add.rectangle(width / 2, groundY, width, 4, 0x4ecca3, 1);
    groundBorder.setOrigin(0.5, 0.5);

    // Player positions
    const player1X = 200;
    const player2X = 600;
    const playerY = height - 180;

    // Use player's selected character from their character data
    // Get from gameState which contains character info
    // Map character types to available sprites
    const smallSprites = ['pink', 'owlet', 'dude']; // 32x32 sprites
    const largeSprites = ['warrior', 'mage', 'rogue']; // 96x96 sprites
    const availableSprites = [...smallSprites, ...largeSprites];
    
    // Get selected character or default based on player position
    let player1Char = this.gameState.player1.selectedCharacter;
    let player2Char = this.gameState.player2.selectedCharacter;
    
    // If selectedCharacter is not one of our available sprites, use defaults
    if (!availableSprites.includes(player1Char)) {
      player1Char = 'pink'; // Default for player 1
    }
    if (!availableSprites.includes(player2Char)) {
      player2Char = 'owlet'; // Default for player 2
    }

    // Determine scale based on sprite size (larger sprites need smaller scale)
    const player1Scale = largeSprites.includes(player1Char) ? 1.5 : 3;
    const player2Scale = largeSprites.includes(player2Char) ? 1.5 : 3;

    // Large sprites face LEFT by default, small sprites face RIGHT by default
    // Player 1 (left side) should face RIGHT, Player 2 (right side) should face LEFT
    const player1NeedsFlip = largeSprites.includes(player1Char); // Large sprites need flip to face right
    const player2NeedsFlip = !largeSprites.includes(player2Char); // Small sprites need flip to face left


    console.log('👤 Player 1 Character:', player1Char, 'Scale:', player1Scale, 'Flip:', player1NeedsFlip);
    console.log('👤 Player 2 Character:', player2Char, 'Scale:', player2Scale, 'Flip:', player2NeedsFlip);
    console.log('🖼️ Available textures:', Object.keys(this.textures.list));
    console.log('🎬 Available animations:', this.anims.getAnimationNames ? this.anims.getAnimationNames() : Object.keys(this.anims.anims.entries));

    // Store character names for animations
    this.playerCharacter = player1Char;
    this.opponentCharacter = player2Char;

    // Create player 1 sprite with animations
    this.playerSprite = this.add.sprite(player1X, playerY, `${player1Char}_idle`);
    this.playerSprite.setScale(player1Scale); // Scale based on sprite size
    this.playerSprite.setOrigin(0.5, 1); // Bottom-center origin
    this.playerSprite.setVisible(true); // Ensure visible
    this.playerSprite.setAlpha(1); // Ensure fully opaque
    this.playerSprite.setFlipX(player1NeedsFlip); // Flip large sprites to face right
    
    // Safely play idle animation for player
    const player1IdleAnim = `${player1Char}_idle_anim`;
    if (this.anims.exists(player1IdleAnim)) {
      this.playerSprite.play(player1IdleAnim);
    } else {
      console.warn('Animation not found:', player1IdleAnim);
    }

    // Create player 2 sprite with animations
    this.opponentSprite = this.add.sprite(player2X, playerY, `${player2Char}_idle`);
    this.opponentSprite.setScale(player2Scale);
    this.opponentSprite.setOrigin(0.5, 1);
    this.opponentSprite.setFlipX(player2NeedsFlip); // Flip small sprites to face left
    this.opponentSprite.setVisible(true); // Ensure visible
    this.opponentSprite.setAlpha(1); // Ensure fully opaque
    
    // Safely play idle animation for opponent
    const player2IdleAnim = `${player2Char}_idle_anim`;
    if (this.anims.exists(player2IdleAnim)) {
      this.opponentSprite.play(player2IdleAnim);
    } else {
      console.warn('Animation not found:', player2IdleAnim);
    }

    // Player names
    this.add.text(player1X, playerY + 60, this.gameState.player1.username, {
      font: '16px monospace',
      fill: '#ffffff'
    }).setOrigin(0.5);

    this.add.text(player2X, playerY + 60, this.gameState.player2.username, {
      font: '16px monospace',
      fill: '#ffffff'
    }).setOrigin(0.5);

    // Create health bars
    this.createHealthBars();

    // Create action buttons
    this.createActionButtons();

    // Turn indicator
    this.turnText = this.add.text(width / 2, 30, '', {
      font: 'bold 24px monospace',
      fill: '#ffdd00'
    }).setOrigin(0.5);

    // Combat log
    this.combatLog = [];
    this.combatLogText = this.add.text(20, height - 80, '', {
      font: '14px monospace',
      fill: '#ffffff',
      wordWrap: { width: width - 40 }
    });

    this.updateUI();
  }

  createHealthBars() {
    const width = this.cameras.main.width;

    // Player 1 health bar (left)
    const p1HBX = 20;
    const p1HBY = 20;

    this.add.text(p1HBX, p1HBY, this.gameState.player1.username, {
      font: '14px monospace',
      fill: '#ffffff'
    });

    this.player1HealthBg = this.add.rectangle(p1HBX, p1HBY + 25, 200, 20, 0x333333).setOrigin(0);
    this.player1HealthBar = this.add.rectangle(p1HBX + 2, p1HBY + 27, 196, 16, 0x4ecca3).setOrigin(0);

    this.player1HealthText = this.add.text(p1HBX + 100, p1HBY + 35, '', {
      font: '12px monospace',
      fill: '#ffffff'
    }).setOrigin(0.5);

    // Player 2 health bar (right)
    const p2HBX = width - 220;
    const p2HBY = 20;

    this.add.text(p2HBX, p2HBY, this.gameState.player2.username, {
      font: '14px monospace',
      fill: '#ffffff'
    });

    this.player2HealthBg = this.add.rectangle(p2HBX, p2HBY + 25, 200, 20, 0x333333).setOrigin(0);
    this.player2HealthBar = this.add.rectangle(p2HBX + 2, p2HBY + 27, 196, 16, 0xee5a6f).setOrigin(0);

    this.player2HealthText = this.add.text(p2HBX + 100, p2HBY + 35, '', {
      font: '12px monospace',
      fill: '#ffffff'
    }).setOrigin(0.5);
  }

  createActionButtons() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const buttonY = height - 150;
    const centerX = width / 2;

    // Attack button
    this.attackBtn = this.createButton(centerX - 70, buttonY, 'ATTACK', 0x4ecca3, () => {
      this.performAction('attack');
    });

    // Defend button
    this.defendBtn = this.createButton(centerX + 70, buttonY, 'DEFEND', 0x3498db, () => {
      this.performAction('defend');
    });

    this.disableButtons();
  }

  createButton(x, y, text, color, onClick) {
    const btn = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, 100, 40, color);
    bg.setStrokeStyle(2, 0xffffff);
    bg.setInteractive({ useHandCursor: true });

    const label = this.add.text(0, 0, text, {
      font: 'bold 14px monospace',
      fill: '#ffffff'
    }).setOrigin(0.5);

    btn.add([bg, label]);

    bg.on('pointerdown', () => {
      if (btn.active) {
        onClick();
      }
    });

    bg.on('pointerover', () => {
      if (btn.active) {
        bg.setFillStyle(Phaser.Display.Color.GetColor(255, 255, 255, 0.2) + color);
      }
    });

    bg.on('pointerout', () => {
      bg.setFillStyle(color);
    });

    btn.active = false;
    btn.bg = bg;

    return btn;
  }

  enableButtons() {
    console.log('🟢 Enabling buttons');
    [this.attackBtn, this.defendBtn].forEach(btn => {
      if (btn) {
        btn.active = true;
        btn.bg.setAlpha(1);
      }
    });
  }

  disableButtons() {
    console.log('🔴 Disabling buttons');
    [this.attackBtn, this.defendBtn].forEach(btn => {
      if (btn) {
        btn.active = false;
        btn.bg.setAlpha(0.5);
      }
    });
  }

  performAction(action) {

    
    if (!this.isMyTurn) {
      console.log('⚠️ Not my turn, ignoring action');
      return;
    }

    if (!this.socket) {
      console.error('❌ Socket is null! Cannot send action');
      return;
    }

    // Disable buttons immediately
    this.disableButtons();

    // Play attack animation for player
    if (action === 'attack' || action === 'special') {
      // Safely play attack animation with null checks
      if (this.playerSprite && this.playerSprite.active && this.playerCharacter) {
        const attackAnimKey = `${this.playerCharacter}_attack_anim`;
        const idleAnimKey = `${this.playerCharacter}_idle_anim`;
        
        // Make sure sprite is visible
        this.playerSprite.setVisible(true);
        this.playerSprite.setAlpha(1);

        // Check if animation exists before playing
        if (this.anims.exists(attackAnimKey)) {
          this.playerSprite.play(attackAnimKey);
          // Return to idle after attack animation completes
          this.playerSprite.once('animationcomplete', () => {
            if (this.playerSprite && this.playerSprite.active && this.anims.exists(idleAnimKey)) {
              this.playerSprite.play(idleAnimKey);
            }
          });
        } else {
          console.warn('Animation not found:', attackAnimKey);
        }
      }
    }

    // Send action to server
    this.socket.emit('game:action', {
      matchId: this.matchId,
      action: action
    });

    this.addToCombatLog(`You used ${action.toUpperCase()}!`);
  }

  setupSocketListeners() {
    this.socket.on('game:turn', (data) => {
      // Safety check - ensure scene is not destroyed
      if (this.isDestroyed) return;
      this.isMyTurn = data.isYourTurn;
      this.updateUI();
    });

    this.socket.on('game:state', (state) => {
      // Safety check - ensure scene is not destroyed
      if (this.isDestroyed) return;
      console.log('📊 Received game state:', state);
      this.gameState = state;
      this.updateUI();
    });

    this.socket.on('game:action:result', (result) => {
      // Safety check - ensure scene is not destroyed
      if (this.isDestroyed) return;
      console.log('⚔️ Action result:', result);
      this.handleActionResult(result);
    });

    this.socket.on('game:end', (data) => {
      // Safety check - ensure scene is not destroyed
      if (this.isDestroyed) return;
      console.log('🏁 Game end received:', data);
      if (!this.gameEnded) {
        this.gameEnded = true;
        this.handleGameEnd(data);
      }
    });

    this.socket.on('error', (error) => {
      // Safety check - ensure scene is not destroyed
      if (this.isDestroyed) return;
      this.addToCombatLog(`Error: ${error.message}`);
    });
  }

  handleActionResult(result) {
    // Safety check - ensure scene is not destroyed
    if (this.isDestroyed) return;
    
    console.log('⚔️ Processing action result:', result);
    
    // Update health values from server
    if (result.player1Health !== undefined) {
      this.gameState.player1.currentHealth = Math.max(0, result.player1Health);
    }
    if (result.player2Health !== undefined) {
      this.gameState.player2.currentHealth = Math.max(0, result.player2Health);
    }

    // Play opponent's attack animation when they attack
    if (result.action === 'attack' || result.action === 'special') {
      // Safely play attack animation with null checks
      if (this.opponentSprite && this.opponentSprite.active && this.opponentCharacter) {
        const attackAnimKey = `${this.opponentCharacter}_attack_anim`;
        const idleAnimKey = `${this.opponentCharacter}_idle_anim`;
        
        // Check if animations exist before playing
        if (this.anims.exists(attackAnimKey)) {
          this.opponentSprite.setVisible(true);
          this.opponentSprite.setAlpha(1);
          this.opponentSprite.play(attackAnimKey);
          this.opponentSprite.once('animationcomplete', () => {
            if (this.opponentSprite && this.opponentSprite.active && this.anims.exists(idleAnimKey)) {
              this.opponentSprite.play(idleAnimKey);
            }
          });
        } else {
          console.warn('Animation not found:', attackAnimKey);
        }
      }
    }

    if (result.missed) {
      this.addToCombatLog(`Attack missed!`);
      this.playMissEffect();
    } else if (result.luckyDodge) {
      this.addToCombatLog(`🍀 LUCKY DODGE! Attack evaded!`);
      this.playLuckyDodgeEffect();
    } else if (result.action === 'defend') {
      this.addToCombatLog(`Defending...`);
      this.playDefendEffect();
    } else {
      const critText = result.isCritical ? ' 💥 CRITICAL!' : '';
      this.addToCombatLog(`${result.damage} damage dealt!${critText}`);
      this.playHitEffect(result.damage, result.isCritical);
    }

    // Update UI to reflect new health values
    this.updateUI();
    
    // Check if game should end locally (failsafe)
    this.checkGameEnd();
  }

  checkGameEnd() {
    // Check if either player's health reached 0
    if (this.gameState.player1.currentHealth <= 0 || this.gameState.player2.currentHealth <= 0) {
      // Determine winner
      let winnerId;
      if (this.gameState.player1.currentHealth <= 0) {
        winnerId = this.gameState.player2.userId;
      } else {
        winnerId = this.gameState.player1.userId;
      }
      
      // Only trigger if not already ended
      if (!this.gameEnded) {
        this.gameEnded = true;
        console.log('🏆 Game ended! Winner:', winnerId);
        
        // Wait a moment for animations to finish, then show end screen
        this.time.delayedCall(1500, () => {
          this.handleGameEnd({
            winnerId: winnerId,
            rewards: { xp: 100, coins: 50, eloChange: 15 }
          });
        });
      }
    }
  }

  handleGameEnd(data) {
    this.disableButtons();

    const didIWin = data.winnerId === this.myUserId;

    this.add.rectangle(400, 300, 500, 300, 0x000000, 0.8);

    const resultText = didIWin ? 'VICTORY!' : 'DEFEAT!';
    const resultColor = didIWin ? '#4ecca3' : '#ee5a6f';

    this.add.text(400, 250, resultText, {
      font: 'bold 48px monospace',
      fill: resultColor
    }).setOrigin(0.5);

    if (didIWin && data.rewards) {
      this.add.text(400, 320, `+${data.rewards.xp} XP`, {
        font: '20px monospace',
        fill: '#ffffff'
      }).setOrigin(0.5);

      this.add.text(400, 350, `+${data.rewards.coins} Coins`, {
        font: '20px monospace',
        fill: '#ffdd00'
      }).setOrigin(0.5);

      if (data.levelUp) {
        this.add.text(400, 380, `LEVEL UP! Now level ${data.levelUp.newLevel}`, {
          font: 'bold 18px monospace',
          fill: '#4ecca3'
        }).setOrigin(0.5);
      }
    }

    // Return to menu button
    const returnBtn = this.add.text(400, 450, 'Return to Menu', {
      font: 'bold 18px monospace',
      fill: '#ffffff',
      backgroundColor: '#3498db',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    returnBtn.on('pointerdown', () => {
      // Signal React to return to menu
      window.dispatchEvent(new CustomEvent('gameEnd', { detail: data }));
    });
  }

  updateUI() {
    console.log('📊 updateUI called, isMyTurn:', this.isMyTurn, 'gameEnded:', this.gameEnded);
    
    if (!this.gameState) {
      console.error('❌ No game state in updateUI!');
      return;
    }
    
    // Safety check - ensure scene objects exist
    if (!this.player1HealthText || !this.player1HealthText.active ||
        !this.player2HealthText || !this.player2HealthText.active ||
        !this.turnText || !this.turnText.active) {
      console.warn('⚠️ UI elements not ready or destroyed');
      return;
    }
    
    // Ensure health values don't go below 0
    this.gameState.player1.currentHealth = Math.max(0, this.gameState.player1.currentHealth);
    this.gameState.player2.currentHealth = Math.max(0, this.gameState.player2.currentHealth);

    // Update health bars
    const p1HealthPercent = this.gameState.player1.currentHealth / this.gameState.player1.maxHealth;
    const p2HealthPercent = this.gameState.player2.currentHealth / this.gameState.player2.maxHealth;

    if (this.player1HealthBar && this.player1HealthBar.active) {
      this.tweens.add({
        targets: this.player1HealthBar,
        scaleX: Math.max(0, p1HealthPercent),
        duration: 300,
        ease: 'Power2'
      });
    }

    if (this.player2HealthBar && this.player2HealthBar.active) {
      this.tweens.add({
        targets: this.player2HealthBar,
        scaleX: Math.max(0, p2HealthPercent),
        duration: 300,
        ease: 'Power2'
      });
    }

    this.player1HealthText.setText(
      `${this.gameState.player1.currentHealth} / ${this.gameState.player1.maxHealth}`
    );

    this.player2HealthText.setText(
      `${this.gameState.player2.currentHealth} / ${this.gameState.player2.maxHealth}`
    );

    // Check for death and play death animation
    if (this.gameState.player1.currentHealth <= 0 && this.playerSprite && this.playerSprite.active) {
      this.playDeathAnimation(this.playerSprite);
    }

    if (this.gameState.player2.currentHealth <= 0 && this.opponentSprite && this.opponentSprite.active) {
      this.playDeathAnimation(this.opponentSprite);
    }

    // Check for game end after health update
    this.checkGameEnd();

    // Update turn indicator (only if game not ended)
    if (!this.gameEnded) {
      if (this.isMyTurn) {
        this.turnText.setText('YOUR TURN');
        this.enableButtons();
      } else {
        this.turnText.setText('OPPONENT\'S TURN');
        this.disableButtons();
      }
    }
  }

  playDeathAnimation(sprite) {
    // Only play once, and check if scene is destroyed
    if (this.isDestroyed || !sprite || sprite.getData('dead')) return;
    sprite.setData('dead', true);

    try {
      // Stop any current animations
      sprite.stop();

      // Death animation: fade out and fall down
      this.tweens.add({
        targets: sprite,
        alpha: 0,
        y: sprite.y + 50,
        angle: 90,
        duration: 1000,
        ease: 'Power2'
      });

      // Add death text
      const deathText = this.add.text(sprite.x, sprite.y - 80, 'DEFEATED!', {
        font: 'bold 24px monospace',
        fill: '#ff0000'
      }).setOrigin(0.5);

      this.tweens.add({
        targets: deathText,
        y: deathText.y - 30,
        alpha: 0,
        duration: 2000,
        onComplete: () => deathText.destroy()
      });
    } catch (e) {
      // Scene was destroyed, ignore
    }
  }

  playHitEffect(damage, isCritical) {
    // Safety check - ensure scene is not destroyed
    if (this.isDestroyed || !this.opponentSprite) return;
    
    try {
      // Flash opponent sprite - FIXED: reset alpha to 1 after flash
      this.tweens.add({
        targets: this.opponentSprite,
        alpha: 0.5,
        duration: 100,
        yoyo: true,
        repeat: 2,
        onComplete: () => {
          // Make sure sprite stays visible after flash
          if (this.opponentSprite && this.opponentSprite.active) {
            this.opponentSprite.setAlpha(1);
            this.opponentSprite.setVisible(true);
          }
        }
      });

      // Shake opponent - store original X position
      const originalX = this.opponentSprite.x;
      this.tweens.add({
        targets: this.opponentSprite,
        x: originalX + 10,
        duration: 50,
        yoyo: true,
        repeat: 3,
        onComplete: () => {
          // Reset to original position
          if (this.opponentSprite && this.opponentSprite.active) {
            this.opponentSprite.x = originalX;
          }
        }
      });

      // Show damage number with enhanced critical display
      const damageText = this.add.text(this.opponentSprite.x, this.opponentSprite.y - 50, 
        isCritical ? `💥 -${damage}` : `-${damage}`, {
        font: `bold ${isCritical ? '36px' : '24px'} monospace`,
        fill: isCritical ? '#ff4444' : '#ffffff',
        stroke: isCritical ? '#880000' : '#000000',
        strokeThickness: isCritical ? 4 : 2
      }).setOrigin(0.5);

      // Critical hit gets extra scale animation
      if (isCritical) {
        this.tweens.add({
          targets: damageText,
          scale: 1.3,
          duration: 150,
          yoyo: true
        });
      }

      this.tweens.add({
        targets: damageText,
        y: damageText.y - 50,
        alpha: 0,
        duration: 1200,
        onComplete: () => damageText.destroy()
      });
    } catch (e) {
      // Scene was destroyed, ignore
    }
  }

  playDefendEffect() {
    // Safety check
    if (this.isDestroyed || !this.playerSprite) return;
    
    try {
      // Show shield effect
      const shield = this.add.circle(this.playerSprite.x, this.playerSprite.y, 50, 0x3498db, 0.5);

      this.tweens.add({
        targets: shield,
        alpha: 0,
        scale: 1.5,
        duration: 500,
        onComplete: () => shield.destroy()
      });
    } catch (e) {
      // Scene was destroyed, ignore
    }
  }

  playMissEffect() {
    // Safety check
    if (this.isDestroyed || !this.opponentSprite) return;
    
    try {
      // Show "MISS" text
      const missText = this.add.text(this.opponentSprite.x, this.opponentSprite.y - 50, 'MISS!', {
        font: 'bold 24px monospace',
        fill: '#888888'
      }).setOrigin(0.5);

      this.tweens.add({
        targets: missText,
        y: missText.y - 50,
        alpha: 0,
        duration: 1000,
        onComplete: () => missText.destroy()
      });
    } catch (e) {
      // Scene was destroyed, ignore
    }
  }

  playLuckyDodgeEffect() {
    // Safety check
    if (this.isDestroyed || !this.playerSprite) return;
    
    try {
      // Show "LUCKY DODGE" text with special green color
      const dodgeText = this.add.text(this.playerSprite.x, this.playerSprite.y - 50, '🍀 LUCKY!', {
        font: 'bold 28px monospace',
        fill: '#2ecc71'
      }).setOrigin(0.5);

      // Flash the player sprite green
      this.tweens.add({
        targets: this.playerSprite,
        alpha: 0.5,
        yoyo: true,
        repeat: 2,
        duration: 100
      });

      this.tweens.add({
        targets: dodgeText,
        y: dodgeText.y - 60,
        alpha: 0,
        scale: 1.5,
        duration: 1200,
        onComplete: () => dodgeText.destroy()
      });
    } catch (e) {
      // Scene was destroyed, ignore
    }
  }

  addToCombatLog(message) {
    // Safety check - ensure scene and text object exist
    if (this.isDestroyed || !this.combatLogText || !this.combatLogText.active) {
      return;
    }
    
    try {
      this.combatLog.unshift(message);
      if (this.combatLog.length > 3) {
        this.combatLog.pop();
      }

      this.combatLogText.setText(this.combatLog.join('\n'));
    } catch (e) {
      // Scene was destroyed, ignore
    }
  }

  // Called when scene is stopped or destroyed
  shutdown() {
    this.isDestroyed = true;
    
    // Remove socket listeners to prevent memory leaks
    if (this.socket) {
      this.socket.off('game:turn');
      this.socket.off('game:state');
      this.socket.off('game:action:result');
      this.socket.off('game:end');
      this.socket.off('error');
    }
  }

  // Also handle destroy
  destroy() {
    this.isDestroyed = true;
    super.destroy();
  }
}
