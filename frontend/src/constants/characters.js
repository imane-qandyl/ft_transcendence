/**
 * Character constants - sprites and class info
 */

export const CHARACTER_SPRITES = [
  { id: 'pink', name: 'Pink Monster', color: '#ff69b4', sprite: '/assets/sprites/pink_idle.png', size: 'small', unlockLevel: 1 },
  { id: 'owlet', name: 'Owlet Monster', color: '#8b4513', sprite: '/assets/sprites/owlet_idle.png', size: 'small', unlockLevel: 5 },
  { id: 'dude', name: 'Dude Monster', color: '#4169e1', sprite: '/assets/sprites/dude_idle.png', size: 'small', unlockLevel: 10 },
  { id: 'warrior', name: 'Warrior', color: '#dc143c', sprite: '/assets/sprites/warrior_idle.png', size: 'large', unlockLevel: 15 },
  { id: 'mage', name: 'Mage', color: '#9932cc', sprite: '/assets/sprites/mage_idle.png', size: 'large', unlockLevel: 20 },
  { id: 'rogue', name: 'Rogue', color: '#228b22', sprite: '/assets/sprites/rogue_idle.png', size: 'large', unlockLevel: 25 }
];

export const UNLOCK_LEVEL = 20;

export const getXPForNextLevel = (level) => {
  return Math.floor(100 * level * 1.5);
};
