exports.up = async function(knex) {
    // Create users table with all required fields
    await knex.schema.createTable('users', function(table) {
        table.increments('id').primary();
        table.string('username', 50).notNullable().unique();
        table.string('email', 255).notNullable().unique();
        table.string('password_hash', 255);
        table.boolean('twofa_enabled').defaultTo(false);
        table.string('twofa_secret', 255);
        table.string('google_id', 255).unique().nullable();
        table.string('avatar_url', 255);
        table.datetime('created_at').notNullable().defaultTo(knex.fn.now());
        table.datetime('updated_at').notNullable().defaultTo(knex.fn.now());
    });

    // Create matches table
    await knex.schema.createTable('matches', function(table) {
        table.increments('id').primary();
        table.integer('player1_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
        table.integer('player2_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
        table.string('match_type').defaultTo('classic');
        table.enum('status', ['pending', 'in_progress', 'completed', 'cancelled']).defaultTo('pending');
        table.integer('player1_score').defaultTo(0);
        table.integer('player2_score').defaultTo(0);
        table.integer('winner_id').unsigned().references('id').inTable('users').nullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        table.timestamp('started_at').defaultTo(knex.fn.now());
        table.timestamp('ended_at').nullable();
    });

    // Create friends table
    await knex.schema.createTable('friends', function(table) {
        table.increments('id').primary();
        table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
        table.integer('friend_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
        table.enum('status', ['pending', 'accepted', 'blocked']).defaultTo('pending');
        table.timestamp('created_at').defaultTo(knex.fn.now());
    });

    // Create refresh_tokens table
    await knex.schema.createTable('refresh_tokens', function(table) {
        table.increments('id').primary();
        table.string('refresh_token_id').notNullable();
        table.string('ip').notNullable();
        table.string('user_agent').notNullable();
        table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
        table.string('device_id').notNullable();
        table.boolean('is_valid').defaultTo(true);
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('expires_at').notNullable();
    });
};

exports.down = async function(knex) {
    await knex.schema.dropTableIfExists('refresh_tokens');
    await knex.schema.dropTableIfExists('friends');
    await knex.schema.dropTableIfExists('matches');
    await knex.schema.dropTableIfExists('users');
};
