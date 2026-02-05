/**
 * Gangster Game Systems Migration
 * Adds territory/turf wars and crime activities for GoodGame Gangster-style gameplay
 */

exports.up = function (knex) {
  return knex.schema
    // Territories - Areas players can control for passive income
    .createTable('territories', (table) => {
      table
        .string('id', 36)
        .primary()
        .defaultTo(knex.raw('(lower(hex(randomblob(16))))'));
      table.string('name', 100).notNullable();
      table.text('description');
      table.integer('level_required').defaultTo(1);
      table.integer('income_per_hour').notNullable(); // Passive coin generation
      table.integer('defense_strength').defaultTo(50); // How hard to capture
      table.string('zone', 50).notNullable(); // downtown, industrial, suburbs, etc.
      table.integer('position_x').notNullable(); // Map X coordinate
      table.integer('position_y').notNullable(); // Map Y coordinate
      table.string('icon', 255); // Territory icon sprite
      table.timestamps(true, true);
    })

    // Territory Ownership - Who controls which territories
    .createTable('territory_ownership', (table) => {
      table
        .string('id', 36)
        .primary()
        .defaultTo(knex.raw('(lower(hex(randomblob(16))))'));
      table
        .string('territory_id', 36)
        .notNullable()
        .unique()
        .references('id')
        .inTable('territories')
        .onDelete('CASCADE');
      table
        .string('character_id', 36)
        .references('id')
        .inTable('characters')
        .onDelete('SET NULL'); // Null = unclaimed
      table.timestamp('captured_at').defaultTo(knex.fn.now());
      table.integer('total_income_earned').defaultTo(0);
      table.timestamps(true, true);
    })

    // Territory Battles - History of territory attacks
    .createTable('territory_battles', (table) => {
      table
        .string('id', 36)
        .primary()
        .defaultTo(knex.raw('(lower(hex(randomblob(16))))'));
      table
        .string('territory_id', 36)
        .notNullable()
        .references('id')
        .inTable('territories')
        .onDelete('CASCADE');
      table
        .string('attacker_id', 36)
        .notNullable()
        .references('id')
        .inTable('characters');
      table
        .string('defender_id', 36)
        .references('id')
        .inTable('characters'); // Null if unclaimed
      table
        .string('winner_id', 36)
        .references('id')
        .inTable('characters');
      table.boolean('successful_capture').defaultTo(false);
      table.integer('attacker_power').notNullable();
      table.integer('defender_power').notNullable();
      table.timestamp('battled_at').defaultTo(knex.fn.now());
      table.timestamps(true, true);
    })

    // Crime Activities - Missions players can complete for rewards
    .createTable('crime_activities', (table) => {
      table
        .string('id', 36)
        .primary()
        .defaultTo(knex.raw('(lower(hex(randomblob(16))))'));
      table.string('name', 100).notNullable();
      table.text('description').notNullable();
      table.string('type', 50).notNullable(); // robbery, heist, smuggle, extortion, etc.
      table.string('difficulty', 20).notNullable(); // easy, medium, hard, extreme
      table.integer('level_required').defaultTo(1);
      table.integer('energy_cost').notNullable(); // How much energy it costs
      table.integer('duration_minutes').notNullable(); // How long it takes
      table.integer('success_rate').notNullable(); // Base success rate (0-100)
      table.integer('coin_reward_min').notNullable();
      table.integer('coin_reward_max').notNullable();
      table.integer('xp_reward').notNullable();
      table.string('icon', 255);
      table.timestamps(true, true);
    })

    // Crime Attempts - Player crime history
    .createTable('crime_attempts', (table) => {
      table
        .string('id', 36)
        .primary()
        .defaultTo(knex.raw('(lower(hex(randomblob(16))))'));
      table
        .string('character_id', 36)
        .notNullable()
        .references('id')
        .inTable('characters')
        .onDelete('CASCADE');
      table
        .string('crime_id', 36)
        .notNullable()
        .references('id')
        .inTable('crime_activities')
        .onDelete('CASCADE');
      table.boolean('success').notNullable();
      table.integer('coins_earned').defaultTo(0);
      table.integer('xp_earned').defaultTo(0);
      table.integer('energy_spent').notNullable();
      table.timestamp('started_at').defaultTo(knex.fn.now());
      table.timestamp('completed_at');
      table.timestamps(true, true);
    })

    // Character Resources - Energy system for crimes
    .createTable('character_resources', (table) => {
      table
        .string('id', 36)
        .primary()
        .defaultTo(knex.raw('(lower(hex(randomblob(16))))'));
      table
        .string('character_id', 36)
        .notNullable()
        .unique()
        .references('id')
        .inTable('characters')
        .onDelete('CASCADE');
      table.integer('energy').defaultTo(100); // Current energy
      table.integer('max_energy').defaultTo(100); // Max energy capacity
      table.integer('energy_regen_per_hour').defaultTo(10); // Energy regeneration rate
      table.timestamp('last_energy_update').defaultTo(knex.fn.now());
      table.integer('total_crimes_completed').defaultTo(0);
      table.integer('total_territories_captured').defaultTo(0);
      table.timestamps(true, true);
    })

    // Gangs/Crews - Group players together
    .createTable('gangs', (table) => {
      table
        .string('id', 36)
        .primary()
        .defaultTo(knex.raw('(lower(hex(randomblob(16))))'));
      table.string('name', 50).notNullable().unique();
      table.string('tag', 10).notNullable().unique(); // Gang tag [TAG]
      table.text('description');
      table
        .string('leader_id', 36)
        .notNullable()
        .references('id')
        .inTable('characters');
      table.integer('level').defaultTo(1);
      table.integer('experience').defaultTo(0);
      table.integer('total_members').defaultTo(1);
      table.integer('max_members').defaultTo(10);
      table.integer('total_territories').defaultTo(0);
      table.string('banner_color', 7).defaultTo('#4ecca3'); // Hex color
      table.timestamps(true, true);
    })

    // Gang Membership
    .createTable('gang_members', (table) => {
      table
        .string('id', 36)
        .primary()
        .defaultTo(knex.raw('(lower(hex(randomblob(16))))'));
      table
        .string('gang_id', 36)
        .notNullable()
        .references('id')
        .inTable('gangs')
        .onDelete('CASCADE');
      table
        .string('character_id', 36)
        .notNullable()
        .unique()
        .references('id')
        .inTable('characters')
        .onDelete('CASCADE');
      table.string('rank', 50).defaultTo('member'); // leader, officer, member
      table.integer('contribution_points').defaultTo(0);
      table.timestamp('joined_at').defaultTo(knex.fn.now());
      table.timestamps(true, true);
    });
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('gang_members')
    .dropTableIfExists('gangs')
    .dropTableIfExists('character_resources')
    .dropTableIfExists('crime_attempts')
    .dropTableIfExists('crime_activities')
    .dropTableIfExists('territory_battles')
    .dropTableIfExists('territory_ownership')
    .dropTableIfExists('territories');
};
