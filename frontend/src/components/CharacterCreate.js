/**
 * Character Selection Screen
 * First page new users see - Choose your fighter with story and strengths
 */

import React, { useState } from 'react';
import api from '../services/api';

// Character definitions with stories and strengths
const CHARACTER_CLASSES = {
  pink: {
    name: 'Pink Monster',
    title: 'The Balanced One',
    sprite: '/assets/sprites/pink_idle.png',
    size: 'small',
    story: `Born in the mystical Pink Forest, this creature learned to adapt to any situation.
    Neither the strongest nor the tankiest, but masters of consistency.
    They say a Pink Monster has never lost the same fight twice.`,
    strengths: [
      '✓ Well-rounded stats - no weaknesses',
      '✓ +10% to ALL stats when leveling up',
      '✓ Great for beginners',
      '✓ Adapts to any playstyle'
    ],
    weakness: 'No exceptional stat - jack of all trades',
    stats: { hp: 100, attack: 20, defense: 10, critical: 5, luck: 5 },
    bonus: '+10% to all stats on level up',
    bonusType: 'balanced',
    color: '#ff69b4',
    bgGradient: 'linear-gradient(135deg, #ff69b4 0%, #ff1493 100%)'
  },
  owlet: {
    name: 'Owlet Monster',
    title: 'The Immovable Tank',
    sprite: '/assets/sprites/owlet_idle.png',
    size: 'small',
    story: `Ancient guardians of the forest, Owlets have protected their territory for centuries.
    Their thick feathers can withstand any blow. Enemies tire themselves out attacking,
    while the Owlet patiently waits for the perfect counter-strike.`,
    strengths: [
      '✓ Highest HP in the game (120)',
      '✓ Best Defense stat (15)',
      '✓ +20% Defense & HP on upgrades',
      '✓ Outlasts opponents in long fights'
    ],
    weakness: 'Lower attack power - fights take longer',
    stats: { hp: 120, attack: 15, defense: 15, critical: 3, luck: 8 },
    bonus: '+20% Defense & HP on upgrade',
    bonusType: 'tank',
    color: '#8b7355',
    bgGradient: 'linear-gradient(135deg, #8b7355 0%, #654321 100%)'
  },
  dude: {
    name: 'Dude Monster',
    title: 'The Aggressive Brawler',
    sprite: '/assets/sprites/dude_idle.png',
    size: 'small',
    story: `Born to fight, Dudes thrive in the chaos of battle. They hit hard and fast,
    overwhelming opponents before they can react. Not the smartest fighters,
    but their raw aggression is terrifying. "Hit first, hit hard, win fast."`,
    strengths: [
      '✓ High Attack power (24)',
      '✓ +25% Attack on upgrades',
      '✓ Balanced HP (95)',
      '✓ Aggressive playstyle'
    ],
    weakness: 'Low luck - no fancy tricks, just raw power',
    stats: { hp: 95, attack: 24, defense: 7, critical: 5, luck: 3 },
    bonus: '+25% Attack on upgrade',
    bonusType: 'brawler',
    color: '#4ecca3',
    bgGradient: 'linear-gradient(135deg, #4ecca3 0%, #26a69a 100%)'
  },
  warrior: {
    name: 'Warrior',
    title: 'The Brutal Force',
    sprite: '/assets/sprites/warrior_idle.png',
    size: 'small',
    spriteScale: 5,
    story: `Forged in the fires of countless battles, Warriors live for combat.
    Each swing of their weapon can devastate opponents. They don't need fancy tricks -
    raw power is their answer to everything. "Why dodge when you can destroy?"`,
    strengths: [
      '✓ Highest Attack power (28)',
      '✓ +30% Attack on upgrades',
      '✓ Decent HP pool (95)',
      '✓ Ends fights quickly'
    ],
    weakness: 'Low luck and average HP - must win fast',
    stats: { hp: 95, attack: 28, defense: 10, critical: 10, luck: 3 },
    bonus: '+30% Attack on upgrade',
    bonusType: 'attacker',
    color: '#e74c3c',
    bgGradient: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)'
  },
  mage: {
    name: 'Mage',
    title: 'The Critical Master',
    sprite: '/assets/sprites/mage_idle.png',
    size: 'small',
    spriteScale: 5,
    story: `Students of the arcane arts, Mages have unlocked the secrets of critical strikes.
    Their attacks may seem weak, but when the stars align, they deal devastating damage.
    "Fortune favors the prepared mind."`,
    strengths: [
      '✓ Highest Critical chance (15%)',
      '✓ +35% Critical & Luck on upgrades',
      '✓ High Luck stat (10)',
      '✓ Massive damage spikes'
    ],
    weakness: 'Fragile - lowest Defense (6) and HP (75)',
    stats: { hp: 75, attack: 22, defense: 6, critical: 15, luck: 10 },
    bonus: '+35% Critical & Luck on upgrade',
    bonusType: 'crit',
    color: '#9b59b6',
    bgGradient: 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)'
  },
  rogue: {
    name: 'Rogue',
    title: 'The Lucky Survivor',
    sprite: '/assets/sprites/rogue_idle.png',
    size: 'small',
    spriteScale: 5,
    story: `Shadows are their home, luck is their weapon. Rogues have an uncanny ability
    to survive situations that would kill anyone else. They dodge fatal blows,
    and somehow always come out on top. "Luck? No, it's skill you can't see."`,
    strengths: [
      '✓ Highest Luck stat (15)',
      '✓ +40% Luck on upgrades',
      '✓ Better dodge chance',
      '✓ Enemies miss more often'
    ],
    weakness: 'Average combat stats',
    stats: { hp: 90, attack: 20, defense: 8, critical: 7, luck: 15 },
    bonus: '+40% Luck on upgrade',
    bonusType: 'lucky',
    color: '#2ecc71',
    bgGradient: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)'
  }
};

const CharacterCreate = ({ onCharacterCreated }) => {
  const [selectedCharacter, setSelectedCharacter] = useState(null); // No default, must pick
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // Step 1: Choose character, Step 2: Enter name

  const selectedClass = selectedCharacter ? CHARACTER_CLASSES[selectedCharacter] : null;

  const handleSelectCharacter = (key) => {
    setSelectedCharacter(key);
    setError('');
  };

  const handleConfirmCharacter = () => {
    if (!selectedCharacter) {
      setError('Please select a character first!');
      return;
    }
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || name.length < 3) {
      setError('Character name must be at least 3 characters');
      return;
    }

    if (name.length > 50) {
      setError('Character name must be less than 50 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (!selectedCharacter) {
        setError('Please select a character.');
        setLoading(false);
        return;
      }
      const response = await api.post('/api/v1/characters', {
        name,
        sprite_body: selectedCharacter,
        sprite_hair: 'hair_short',
        sprite_outfit: 'outfit_basic',
        characterClass: selectedCharacter
      });
      if (response.data) {
        if (onCharacterCreated) {
          onCharacterCreated(response.data);
        }
      }
    } catch (err) {
      console.error('Character creation error:', err);
      setError(err.response?.data?.error || 'Failed to create character');
    } finally {
      setLoading(false);
    }
  };

  // STEP 1: Character Selection Screen
  if (step === 1) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.mainTitle}>⚔️ CHOOSE YOUR FIGHTER ⚔️</h1>
          <p style={styles.mainSubtitle}>
            Each warrior has a unique story and fighting style. Choose wisely - this decision is permanent until Level 20!
          </p>
        </div>

        {/* Character Grid */}
        <div style={styles.characterGrid}>
          {Object.entries(CHARACTER_CLASSES).map(([key, char]) => (
            <div
              key={key}
              onClick={() => handleSelectCharacter(key)}
              style={{
                ...styles.characterCard,
                border: selectedCharacter === key ? `4px solid ${char.color}` : '4px solid #4a4a68',
                boxShadow: selectedCharacter === key ? `0 0 0 4px ${char.color}, 8px 8px 0px #0f0f1b` : '8px 8px 0px #0f0f1b'
              }}
            >
              {/* Character Header */}
              <div style={{ ...styles.cardHeader, backgroundColor: char.color, borderBottom: '4px solid #4a4a68' }}>
                <div style={{
                  ...styles.spriteWrapper,
                  width: '80px',
                  height: '80px'
                }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      backgroundImage: `url(${char.sprite})`,
                      backgroundPosition: '0 0',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '128px 32px',
                      imageRendering: 'pixelated',
                      transform: `scale(${char.spriteScale || 2})`
                    }}
                    title={char.name}
                  />
                </div>
                <h2 style={styles.charName}>{char.name}</h2>
                <p style={styles.charTitle}>{char.title}</p>
              </div>

              {/* Character Story */}
              <div style={styles.storySection}>
                <p style={styles.story}>{char.story}</p>
              </div>

              {/* Strengths */}
              <div style={styles.strengthsSection}>
                <h3 style={{ ...styles.sectionTitle, color: char.color }}>💪 STRENGTHS</h3>
                <ul style={styles.strengthsList}>
                  {char.strengths.map((strength, i) => (
                    <li key={i} style={styles.strengthItem}>{strength}</li>
                  ))}
                </ul>
              </div>

              {/* Weakness */}
              <div style={styles.weaknessSection}>
                <span style={styles.weaknessLabel}>⚠️ Weakness:</span>
                <span style={styles.weaknessText}>{char.weakness}</span>
              </div>

              {/* Stats Preview */}
              <div style={styles.statsPreview}>
                <div style={styles.statItem}>
                  <span>❤️</span>
                  <div style={styles.statBar}>
                    <div style={{ ...styles.statFill, width: `${(char.stats.hp / 120) * 100}%`, backgroundColor: '#e74c3c' }} />
                  </div>
                  <span style={styles.statValue}>{char.stats.hp}</span>
                </div>
                <div style={styles.statItem}>
                  <span>⚔️</span>
                  <div style={styles.statBar}>
                    <div style={{ ...styles.statFill, width: `${(char.stats.attack / 28) * 100}%`, backgroundColor: '#e67e22' }} />
                  </div>
                  <span style={styles.statValue}>{char.stats.attack}</span>
                </div>
                <div style={styles.statItem}>
                  <span>🛡️</span>
                  <div style={styles.statBar}>
                    <div style={{ ...styles.statFill, width: `${(char.stats.defense / 15) * 100}%`, backgroundColor: '#3498db' }} />
                  </div>
                  <span style={styles.statValue}>{char.stats.defense}</span>
                </div>
                <div style={styles.statItem}>
                  <span>💥</span>
                  <div style={styles.statBar}>
                    <div style={{ ...styles.statFill, width: `${(char.stats.critical / 15) * 100}%`, backgroundColor: '#9b59b6' }} />
                  </div>
                  <span style={styles.statValue}>{char.stats.critical}%</span>
                </div>
                <div style={styles.statItem}>
                  <span>🍀</span>
                  <div style={styles.statBar}>
                    <div style={{ ...styles.statFill, width: `${(char.stats.luck / 15) * 100}%`, backgroundColor: '#2ecc71' }} />
                  </div>
                  <span style={styles.statValue}>{char.stats.luck}%</span>
                </div>
              </div>

              {/* Level Up Bonus */}
              <div style={{ ...styles.bonusBanner, backgroundColor: `${char.color}20`, borderColor: char.color }}>
                <span style={{ color: char.color, fontWeight: 'bold' }}>⭐ {char.bonus}</span>
              </div>

              {/* Selection Indicator */}
              {selectedCharacter === key && (
                <div style={{ ...styles.selectedBadge, backgroundColor: char.color }}>
                  ✓ SELECTED
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div style={styles.errorBox}>
            ❌ {error}
          </div>
        )}

        {/* Confirm Button */}
        <div style={styles.confirmSection}>
          {selectedCharacter ? (
            <button
              onClick={handleConfirmCharacter}
              style={{ ...styles.confirmButton, backgroundColor: selectedClass.color }}
            >
              ⚔️ Continue with {selectedClass.name}
            </button>
          ) : (
            <div style={styles.selectPrompt}>
              👆 Click on a character above to select them
            </div>
          )}
        </div>
      </div>
    );
  }

  // STEP 2: Enter Name Screen
  return (
    <div style={styles.container}>
      <div style={styles.nameScreen}>
        <button onClick={handleBack} style={styles.backButton}>
          ← Back to Character Selection
        </button>

        <div style={styles.selectedCharDisplay}>
          <div style={{ ...styles.bigSpriteWrapper, borderColor: selectedClass.color, boxShadow: `0 0 40px ${selectedClass.color}50` }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                backgroundImage: `url(${selectedClass.sprite})`,
                backgroundPosition: '0 0',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '128px 32px',
                imageRendering: 'pixelated',
                transform: `scale(${(selectedClass.spriteScale || 2) * 1.5})`
              }}
              title={selectedClass.name}
            />
          </div>
          <h2 style={{ ...styles.selectedName, color: selectedClass.color }}>{selectedClass.name}</h2>
          <p style={styles.selectedTitle}>{selectedClass.title}</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.nameForm}>
          <h3 style={styles.namePrompt}>Enter Your Gangster Name</h3>
          <p style={styles.nameHint}>This name will be shown to other players in battles</p>
          
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your warrior name..."
            style={{ ...styles.nameInput, borderColor: selectedClass.color }}
            maxLength={50}
            disabled={loading}
            autoFocus
          />
          
          <small style={styles.charCount}>{name.length}/50 characters (min 3)</small>

          {error && (
            <div style={styles.errorBox}>
              ❌ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || name.length < 3}
            style={{
              ...styles.startButton,
              backgroundColor: name.length >= 3 ? selectedClass.color : '#555',
              cursor: name.length >= 3 && !loading ? 'pointer' : 'not-allowed'
            }}
          >
            {loading ? '⏳ Creating...' : `🎮 START YOUR JOURNEY AS ${selectedClass.name.toUpperCase()}`}
          </button>
        </form>

        <div style={styles.reminderBox}>
          <p>🔒 Remember: You cannot change your character class until Level 20!</p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#0f0f1b',
    padding: '30px 20px',
    overflowX: 'hidden'
  },
  header: {
    textAlign: 'center',
    marginBottom: '40px'
  },
  mainTitle: {
    fontSize: '24px',
    color: '#00f5d4',
    textShadow: '4px 4px 0px #0f0f1b',
    marginBottom: '15px',
    letterSpacing: '3px',
    fontFamily: '"Press Start 2P", monospace'
  },
  mainSubtitle: {
    fontSize: '10px',
    color: '#c8c8d4',
    maxWidth: '900px',
    margin: '0 auto',
    lineHeight: '1.8',
    fontFamily: '"Press Start 2P", monospace'
  },
  characterGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '25px',
    maxWidth: '1400px',
    margin: '0 auto 30px'
  },
  characterCard: {
    backgroundColor: '#1a1a2e',
    border: '4px solid #4a4a68',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'all 0.1s ease',
    position: 'relative',
    boxShadow: '8px 8px 0px #0f0f1b'
  },
  cardHeader: {
    padding: '25px 20px',
    textAlign: 'center',
    border: 'none'
  },
  spriteWrapper: {
    width: '80px',
    height: '80px',
    margin: '0 auto 15px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2d2d44',
    border: '3px solid #4a4a68',
    overflow: 'hidden'
  },
  sprite: {
    width: '32px',
    height: '32px'
  },
  charName: {
    fontSize: '16px',
    color: '#fff',
    margin: '0 0 8px 0',
    textShadow: '2px 2px 0px #0f0f1b',
    fontFamily: '"Press Start 2P", monospace',
    letterSpacing: '2px'
  },
  charTitle: {
    fontSize: '8px',
    color: '#9b5de5',
    fontStyle: 'normal',
    margin: 0,
    fontFamily: '"Press Start 2P", monospace'
  },
  storySection: {
    padding: '20px',
    backgroundColor: '#2d2d44',
    borderTop: '3px solid #4a4a68',
    borderBottom: '3px solid #4a4a68'
  },
  story: {
    fontSize: '8px',
    color: '#c8c8d4',
    lineHeight: '1.8',
    margin: 0,
    fontStyle: 'normal',
    fontFamily: '"Press Start 2P", monospace'
  },
  strengthsSection: {
    padding: '15px 20px'
  },
  sectionTitle: {
    fontSize: '10px',
    marginBottom: '12px',
    letterSpacing: '1px',
    fontFamily: '"Press Start 2P", monospace',
    textShadow: '2px 2px 0px #0f0f1b'
  },
  strengthsList: {
    listStyle: 'none',
    padding: 0,
    margin: 0
  },
  strengthItem: {
    fontSize: '8px',
    color: '#00f5d4',
    marginBottom: '8px',
    fontFamily: '"Press Start 2P", monospace',
    paddingLeft: '12px',
    position: 'relative'
  },
  weaknessSection: {
    padding: '12px 20px',
    backgroundColor: '#2d2d44',
    borderTop: '3px solid #4a4a68'
  },
  weaknessLabel: {
    fontSize: '8px',
    color: '#ff6b6b',
    marginRight: '8px',
    fontFamily: '"Press Start 2P", monospace'
  },
  weaknessText: {
    fontSize: '8px',
    color: '#c8c8d4',
    fontFamily: '"Press Start 2P", monospace'
  },
  statsPreview: {
    padding: '15px 20px',
    backgroundColor: '#1a1a2e'
  },
  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '10px',
    fontSize: '12px'
  },
  statBar: {
    flex: 1,
    height: '12px',
    backgroundColor: '#2d2d44',
    border: '2px solid #4a4a68',
    overflow: 'hidden'
  },
  statFill: {
    height: '100%',
    transition: 'width 0.1s'
  },
  statValue: {
    width: '35px',
    textAlign: 'right',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: '8px',
    fontFamily: '"Press Start 2P", monospace'
  },
  bonusBanner: {
    padding: '12px 20px',
    textAlign: 'center',
    border: '3px solid',
    margin: '15px',
    fontSize: '8px',
    fontFamily: '"Press Start 2P", monospace',
    fontWeight: 'normal'
  },
  selectedBadge: {
    position: 'absolute',
    top: '15px',
    right: '15px',
    padding: '8px 15px',
    border: 'none',
    fontSize: '8px',
    fontWeight: 'bold',
    color: '#fff',
    boxShadow: '4px 4px 0px #0f0f1b',
    fontFamily: '"Press Start 2P", monospace'
  },
  errorBox: {
    backgroundColor: '#e74c3c',
    color: '#fff',
    padding: '15px',
    border: '3px solid #c0392b',
    textAlign: 'center',
    maxWidth: '500px',
    margin: '20px auto',
    fontFamily: '"Press Start 2P", monospace',
    fontSize: '8px',
    boxShadow: '6px 6px 0px #0f0f1b'
  },
  confirmSection: {
    textAlign: 'center',
    marginTop: '30px'
  },
  confirmButton: {
    padding: '18px 50px',
    fontSize: '10px',
    fontWeight: 'bold',
    color: '#fff',
    border: '4px solid #0f0f1b',
    cursor: 'pointer',
    transition: 'all 0.1s',
    boxShadow: '6px 6px 0px #0f0f1b',
    fontFamily: '"Press Start 2P", monospace',
    letterSpacing: '2px'
  },
  selectPrompt: {
    fontSize: '10px',
    color: '#888',
    padding: '20px',
    backgroundColor: '#1a1a2e',
    border: '3px dashed #4a4a68',
    fontFamily: '"Press Start 2P", monospace'
  },
  // Step 2 styles
  nameScreen: {
    maxWidth: '600px',
    margin: '0 auto',
    textAlign: 'center'
  },
  backButton: {
    background: '#1a1a2e',
    border: '3px solid #4a4a68',
    color: '#c8c8d4',
    padding: '10px 20px',
    cursor: 'pointer',
    marginBottom: '30px',
    fontSize: '8px',
    transition: 'all 0.1s',
    fontFamily: '"Press Start 2P", monospace',
    boxShadow: '4px 4px 0px #0f0f1b'
  },
  selectedCharDisplay: {
    marginBottom: '40px'
  },
  bigSpriteWrapper: {
    width: '150px',
    height: '150px',
    margin: '0 auto 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a0a10',
    border: '4px solid',
    overflow: 'hidden',
    boxShadow: '8px 8px 0px #0f0f1b'
  },
  bigSprite: {
    width: '64px',
    height: '64px'
  },
  selectedName: {
    fontSize: '20px',
    marginBottom: '5px',
    fontFamily: '"Press Start 2P", monospace',
    textShadow: '3px 3px 0px #0f0f1b',
    letterSpacing: '2px'
  },
  selectedTitle: {
    fontSize: '10px',
    color: '#888',
    fontStyle: 'normal',
    fontFamily: '"Press Start 2P", monospace'
  },
  nameForm: {
    backgroundColor: '#1a1a2e',
    padding: '40px',
    border: '4px solid #4a4a68',
    marginBottom: '30px',
    boxShadow: '8px 8px 0px #0f0f1b'
  },
  namePrompt: {
    fontSize: '12px',
    color: '#00f5d4',
    marginBottom: '10px',
    fontFamily: '"Press Start 2P", monospace',
    textShadow: '2px 2px 0px #0f0f1b'
  },
  nameHint: {
    fontSize: '8px',
    color: '#888',
    marginBottom: '25px',
    fontFamily: '"Press Start 2P", monospace'
  },
  nameInput: {
    width: '100%',
    padding: '18px',
    fontSize: '12px',
    border: '3px solid #4a4a68',
    backgroundColor: '#0a0a10',
    color: '#fff',
    textAlign: 'center',
    outline: 'none',
    transition: 'border-color 0.1s',
    boxSizing: 'border-box',
    fontFamily: '"Press Start 2P", monospace',
    boxShadow: 'inset 4px 4px 0px #0f0f1b'
  },
  charCount: {
    display: 'block',
    color: '#666',
    marginTop: '10px',
    marginBottom: '25px',
    fontSize: '8px',
    fontFamily: '"Press Start 2P", monospace'
  },
  startButton: {
    width: '100%',
    padding: '18px',
    fontSize: '10px',
    fontWeight: 'bold',
    color: '#fff',
    border: '4px solid #0f0f1b',
    transition: 'all 0.1s',
    fontFamily: '"Press Start 2P", monospace',
    boxShadow: '6px 6px 0px #0f0f1b',
    letterSpacing: '1px'
  },
  reminderBox: {
    backgroundColor: '#1a1a2e',
    border: '3px solid #f39c12',
    padding: '15px',
    color: '#f39c12',
    fontSize: '8px',
    fontFamily: '"Press Start 2P", monospace',
    boxShadow: '4px 4px 0px #0f0f1b'
  }
};

export default CharacterCreate;
