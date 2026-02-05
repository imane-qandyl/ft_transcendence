exports.up = async function(knex) {
    // Add indexes for better performance on existing tables
    await knex.schema.alterTable('users', function(table) {
        table.index('email');
        table.index('username');
        table.index('google_id');
    });

    await knex.schema.alterTable('matches', function(table) {
        table.index(['player1_id', 'player2_id']);
        table.index('tournament_id');
        table.index('winner_id');
    });

    await knex.schema.alterTable('friends', function(table) {
        table.index(['user_id', 'friend_id']);
        table.index('status');
    });

    await knex.schema.alterTable('tournaments', function(table) {
        table.index('created_by');
        table.index('status');
    });

    await knex.schema.alterTable('refresh_tokens', function(table) {
        table.index('user_id');
        table.index('device_id');
        table.index('refresh_token_id');
        table.index(['user_id', 'device_id']);
    });
};

exports.down = async function(knex) {
    // Remove indexes (SQLite will handle this when tables are dropped)
    await knex.schema.alterTable('refresh_tokens', function(table) {
        table.dropIndex('user_id');
        table.dropIndex('device_id');
        table.dropIndex('refresh_token_id');
        table.dropIndex(['user_id', 'device_id']);
    });

    await knex.schema.alterTable('tournaments', function(table) {
        table.dropIndex('created_by');
        table.dropIndex('status');
    });

    await knex.schema.alterTable('friends', function(table) {
        table.dropIndex(['user_id', 'friend_id']);
        table.dropIndex('status');
    });

    await knex.schema.alterTable('matches', function(table) {
        table.dropIndex(['player1_id', 'player2_id']);
        table.dropIndex('tournament_id');
        table.dropIndex('winner_id');
    });

    await knex.schema.alterTable('users', function(table) {
        table.dropIndex('email');
        table.dropIndex('username');
        table.dropIndex('google_id');
    });
};
