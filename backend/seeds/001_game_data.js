/**
 * Seed data for Street Pixel Wars
 * Populates items, achievements, and initial game data
 */

exports.seed = async function(knex) {
  // Clear existing data
  await knex('character_achievements').del();
  await knex('achievements').del();
  await knex('character_equipment').del();
  await knex('character_inventory').del();
  await knex('items').del();

  // Insert starter items
  const items = [
    // Weapons
    {
      name: 'Rusty Knife',
      type: 'weapon',
      slot: 'weapon',
      rarity: 'common',
      attack_bonus: 5,
      defense_bonus: 0,
      health_bonus: 0,
      speed_bonus: 2,
      level_required: 1,
      price: 100,
      sprite_key: 'weapon_knife_rusty',
      description: 'A worn knife. Better than bare fists.'
    },
    {
      name: 'Steel Bat',
      type: 'weapon',
      slot: 'weapon',
      rarity: 'common',
      attack_bonus: 10,
      defense_bonus: 0,
      health_bonus: 0,
      speed_bonus: 0,
      level_required: 3,
      price: 300,
      sprite_key: 'weapon_bat_steel',
      description: 'A sturdy baseball bat. Packs a punch.'
    },
    {
      name: 'Street Katana',
      type: 'weapon',
      slot: 'weapon',
      rarity: 'rare',
      attack_bonus: 20,
      defense_bonus: 0,
      health_bonus: 0,
      speed_bonus: 5,
      level_required: 10,
      price: 1500,
      sprite_key: 'weapon_katana',
      description: 'A sharp blade from the streets of Tokyo.'
    },
    {
      name: 'Golden Pistol',
      type: 'weapon',
      slot: 'weapon',
      rarity: 'epic',
      attack_bonus: 35,
      defense_bonus: 0,
      health_bonus: 0,
      speed_bonus: 10,
      level_required: 20,
      price: 5000,
      sprite_key: 'weapon_pistol_gold',
      description: 'A powerful handgun. Respect the trigger.'
    },

    // Armor (Body)
    {
      name: 'Leather Jacket',
      type: 'armor',
      slot: 'body',
      rarity: 'common',
      attack_bonus: 0,
      defense_bonus: 8,
      health_bonus: 10,
      speed_bonus: 0,
      level_required: 1,
      price: 150,
      sprite_key: 'armor_jacket_leather',
      description: 'Classic street protection.'
    },
    {
      name: 'Bulletproof Vest',
      type: 'armor',
      slot: 'body',
      rarity: 'rare',
      attack_bonus: 0,
      defense_bonus: 20,
      health_bonus: 30,
      speed_bonus: -3,
      level_required: 8,
      price: 1200,
      sprite_key: 'armor_vest_bulletproof',
      description: 'Heavy protection. Slows you down.'
    },
    {
      name: 'Reinforced Combat Armor',
      type: 'armor',
      slot: 'body',
      rarity: 'epic',
      attack_bonus: 5,
      defense_bonus: 35,
      health_bonus: 50,
      speed_bonus: 0,
      level_required: 18,
      price: 4500,
      sprite_key: 'armor_combat_reinforced',
      description: 'Military-grade protection with mobility.'
    },

    // Helmets
    {
      name: 'Baseball Cap',
      type: 'armor',
      slot: 'head',
      rarity: 'common',
      attack_bonus: 0,
      defense_bonus: 2,
      health_bonus: 5,
      speed_bonus: 0,
      level_required: 1,
      price: 50,
      sprite_key: 'helmet_cap',
      description: 'Minimal protection, maximum style.'
    },
    {
      name: 'Motorcycle Helmet',
      type: 'armor',
      slot: 'head',
      rarity: 'common',
      attack_bonus: 0,
      defense_bonus: 10,
      health_bonus: 15,
      speed_bonus: -1,
      level_required: 5,
      price: 400,
      sprite_key: 'helmet_motorcycle',
      description: 'Solid head protection.'
    },
    {
      name: 'Tactical Helmet',
      type: 'armor',
      slot: 'head',
      rarity: 'rare',
      attack_bonus: 0,
      defense_bonus: 18,
      health_bonus: 25,
      speed_bonus: 0,
      level_required: 15,
      price: 2500,
      sprite_key: 'helmet_tactical',
      description: 'Military spec headgear.'
    },

    // Accessories
    {
      name: 'Gold Chain',
      type: 'accessory',
      slot: 'accessory',
      rarity: 'common',
      attack_bonus: 2,
      defense_bonus: 0,
      health_bonus: 0,
      speed_bonus: 0,
      level_required: 1,
      price: 200,
      sprite_key: 'accessory_chain_gold',
      description: 'Shows you mean business.'
    },
    {
      name: 'Energy Drink',
      type: 'accessory',
      slot: 'accessory',
      rarity: 'rare',
      attack_bonus: 0,
      defense_bonus: 0,
      health_bonus: 0,
      speed_bonus: 15,
      level_required: 10,
      price: 1800,
      sprite_key: 'accessory_energy_drink',
      description: 'Permanent speed boost!'
    },
    {
      name: 'Lucky Charm',
      type: 'accessory',
      slot: 'accessory',
      rarity: 'epic',
      attack_bonus: 10,
      defense_bonus: 10,
      health_bonus: 20,
      speed_bonus: 5,
      level_required: 25,
      price: 8000,
      sprite_key: 'accessory_lucky_charm',
      description: 'Balanced stats boost. Very rare.'
    }
  ];

  await knex('items').insert(items);

  // Insert achievements
  const achievements = [
    {
      name: 'First Blood',
      description: 'Win your first battle',
      xp_reward: 100,
      coin_reward: 500,
      icon: 'achievement_first_blood.png'
    },
    {
      name: 'Street Fighter',
      description: 'Win 10 battles',
      xp_reward: 500,
      coin_reward: 2000,
      icon: 'achievement_street_fighter.png'
    },
    {
      name: 'Warrior',
      description: 'Win 50 battles',
      xp_reward: 2000,
      coin_reward: 10000,
      icon: 'achievement_warrior.png'
    },
    {
      name: 'Legend',
      description: 'Win 100 battles',
      xp_reward: 5000,
      coin_reward: 25000,
      icon: 'achievement_legend.png'
    },
    {
      name: 'Level 10',
      description: 'Reach level 10',
      xp_reward: 1000,
      coin_reward: 5000,
      icon: 'achievement_level_10.png'
    },
    {
      name: 'Level 25',
      description: 'Reach level 25',
      xp_reward: 3000,
      coin_reward: 15000,
      icon: 'achievement_level_25.png'
    },
    {
      name: 'Big Spender',
      description: 'Spend 10,000 coins in the shop',
      xp_reward: 800,
      coin_reward: 3000,
      icon: 'achievement_big_spender.png'
    },
    {
      name: 'Fully Equipped',
      description: 'Equip an item in every slot',
      xp_reward: 500,
      coin_reward: 2000,
      icon: 'achievement_fully_equipped.png'
    }
  ];

  await knex('achievements').insert(achievements);
};
