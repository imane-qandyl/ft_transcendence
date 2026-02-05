/**
 * Seed data for gangster systems - territories and crimes
 */

exports.seed = async function(knex) {
  // Clear existing data
  await knex('gang_members').del();
  await knex('gangs').del();
  await knex('crime_attempts').del();
  await knex('crime_activities').del();
  await knex('territory_battles').del();
  await knex('territory_ownership').del();
  await knex('territories').del();

  // Insert territories across the city
  const territories = [
    // Downtown Zone - High income, high competition
    {
      name: 'Main Street Casino',
      description: 'Luxury casino in the heart of downtown. High stakes, high rewards.',
      level_required: 15,
      income_per_hour: 500,
      defense_strength: 100,
      zone: 'downtown',
      position_x: 400,
      position_y: 300,
      icon: 'territory_casino.png'
    },
    {
      name: 'Downtown Bank',
      description: 'The central bank. Controlling this shows true power.',
      level_required: 20,
      income_per_hour: 800,
      defense_strength: 150,
      zone: 'downtown',
      position_x: 500,
      position_y: 250,
      icon: 'territory_bank.png'
    },
    {
      name: 'Nightclub District',
      description: 'Popular nightclubs. Money flows here every night.',
      level_required: 10,
      income_per_hour: 300,
      defense_strength: 70,
      zone: 'downtown',
      position_x: 350,
      position_y: 400,
      icon: 'territory_nightclub.png'
    },

    // Industrial Zone - Medium income, medium difficulty
    {
      name: 'Warehouse District',
      description: 'Control the warehouses, control the goods.',
      level_required: 5,
      income_per_hour: 150,
      defense_strength: 50,
      zone: 'industrial',
      position_x: 200,
      position_y: 150,
      icon: 'territory_warehouse.png'
    },
    {
      name: 'Shipping Docks',
      description: 'All imports come through here.',
      level_required: 12,
      income_per_hour: 400,
      defense_strength: 90,
      zone: 'industrial',
      position_x: 100,
      position_y: 100,
      icon: 'territory_docks.png'
    },
    {
      name: 'Factory Row',
      description: 'Old factories, new opportunities.',
      level_required: 8,
      income_per_hour: 200,
      defense_strength: 60,
      zone: 'industrial',
      position_x: 250,
      position_y: 200,
      icon: 'territory_factory.png'
    },

    // Suburbs - Lower income, easier to capture
    {
      name: 'Corner Store',
      description: 'Small time operation. Perfect for beginners.',
      level_required: 1,
      income_per_hour: 50,
      defense_strength: 20,
      zone: 'suburbs',
      position_x: 600,
      position_y: 450,
      icon: 'territory_store.png'
    },
    {
      name: 'Gas Station',
      description: 'Everyone needs gas. Steady income.',
      level_required: 3,
      income_per_hour: 100,
      defense_strength: 35,
      zone: 'suburbs',
      position_x: 650,
      position_y: 500,
      icon: 'territory_gas.png'
    },
    {
      name: 'Suburban Mall',
      description: 'Shopping mall in the suburbs. Decent territory.',
      level_required: 7,
      income_per_hour: 180,
      defense_strength: 55,
      zone: 'suburbs',
      position_x: 700,
      position_y: 400,
      icon: 'territory_mall.png'
    },

    // Red Light District - Special zone
    {
      name: 'Red Light District',
      description: 'Where the city\'s secrets hide. Very profitable.',
      level_required: 18,
      income_per_hour: 600,
      defense_strength: 120,
      zone: 'red_light',
      position_x: 300,
      position_y: 500,
      icon: 'territory_red_light.png'
    }
  ];

  await knex('territories').insert(territories);

  // Insert crime activities
  const crimes = [
    // Easy Crimes - Low level
    {
      name: 'Pickpocket Tourist',
      description: 'Steal from unsuspecting tourists. Quick and simple.',
      type: 'robbery',
      difficulty: 'easy',
      level_required: 1,
      energy_cost: 10,
      duration_minutes: 5,
      success_rate: 80,
      coin_reward_min: 50,
      coin_reward_max: 150,
      xp_reward: 25,
      icon: 'crime_pickpocket.png'
    },
    {
      name: 'Rob Corner Store',
      description: 'Hold up a corner store. Low risk, low reward.',
      type: 'robbery',
      difficulty: 'easy',
      level_required: 2,
      energy_cost: 15,
      duration_minutes: 10,
      success_rate: 75,
      coin_reward_min: 100,
      coin_reward_max: 300,
      xp_reward: 50,
      icon: 'crime_store_robbery.png'
    },
    {
      name: 'Steal a Car',
      description: 'Grand theft auto. Sell it to a chop shop.',
      type: 'theft',
      difficulty: 'easy',
      level_required: 3,
      energy_cost: 20,
      duration_minutes: 15,
      success_rate: 70,
      coin_reward_min: 200,
      coin_reward_max: 500,
      xp_reward: 75,
      icon: 'crime_car_theft.png'
    },

    // Medium Crimes
    {
      name: 'Burglary',
      description: 'Break into a house and steal valuables.',
      type: 'robbery',
      difficulty: 'medium',
      level_required: 5,
      energy_cost: 25,
      duration_minutes: 20,
      success_rate: 65,
      coin_reward_min: 300,
      coin_reward_max: 800,
      xp_reward: 125,
      icon: 'crime_burglary.png'
    },
    {
      name: 'Drug Run',
      description: 'Transport illegal substances across the city.',
      type: 'smuggle',
      difficulty: 'medium',
      level_required: 7,
      energy_cost: 30,
      duration_minutes: 30,
      success_rate: 60,
      coin_reward_min: 500,
      coin_reward_max: 1200,
      xp_reward: 175,
      icon: 'crime_drug_run.png'
    },
    {
      name: 'Extort Business',
      description: 'Demand protection money from local businesses.',
      type: 'extortion',
      difficulty: 'medium',
      level_required: 10,
      energy_cost: 35,
      duration_minutes: 25,
      success_rate: 70,
      coin_reward_min: 400,
      coin_reward_max: 1000,
      xp_reward: 150,
      icon: 'crime_extortion.png'
    },

    // Hard Crimes
    {
      name: 'Armed Robbery',
      description: 'Rob a jewelry store with weapons. High risk, high reward.',
      type: 'robbery',
      difficulty: 'hard',
      level_required: 12,
      energy_cost: 40,
      duration_minutes: 35,
      success_rate: 55,
      coin_reward_min: 800,
      coin_reward_max: 2000,
      xp_reward: 250,
      icon: 'crime_armed_robbery.png'
    },
    {
      name: 'Hijack Truck',
      description: 'Hijack a delivery truck full of expensive goods.',
      type: 'theft',
      difficulty: 'hard',
      level_required: 14,
      energy_cost: 45,
      duration_minutes: 40,
      success_rate: 50,
      coin_reward_min: 1000,
      coin_reward_max: 2500,
      xp_reward: 300,
      icon: 'crime_hijack.png'
    },
    {
      name: 'Smuggle Weapons',
      description: 'Smuggle illegal firearms across borders.',
      type: 'smuggle',
      difficulty: 'hard',
      level_required: 16,
      energy_cost: 50,
      duration_minutes: 45,
      success_rate: 55,
      coin_reward_min: 1200,
      coin_reward_max: 3000,
      xp_reward: 350,
      icon: 'crime_weapons.png'
    },

    // Extreme Crimes - Very high level
    {
      name: 'Bank Heist',
      description: 'Rob the central bank. The ultimate crime.',
      type: 'heist',
      difficulty: 'extreme',
      level_required: 20,
      energy_cost: 60,
      duration_minutes: 60,
      success_rate: 40,
      coin_reward_min: 2000,
      coin_reward_max: 5000,
      xp_reward: 500,
      icon: 'crime_bank_heist.png'
    },
    {
      name: 'Casino Heist',
      description: 'Ocean\'s Eleven style. Plan the perfect heist.',
      type: 'heist',
      difficulty: 'extreme',
      level_required: 22,
      energy_cost: 70,
      duration_minutes: 75,
      success_rate: 35,
      coin_reward_min: 2500,
      coin_reward_max: 6000,
      xp_reward: 600,
      icon: 'crime_casino_heist.png'
    },
    {
      name: 'Assassinate Rival',
      description: 'Take out a rival gang leader. Dangerous but profitable.',
      type: 'hit',
      difficulty: 'extreme',
      level_required: 25,
      energy_cost: 80,
      duration_minutes: 90,
      success_rate: 45,
      coin_reward_min: 3000,
      coin_reward_max: 7500,
      xp_reward: 750,
      icon: 'crime_assassination.png'
    }
  ];

  await knex('crime_activities').insert(crimes);
};
