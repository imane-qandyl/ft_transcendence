exports.up = function(knex) {
  return knex.schema.createTable('notifications', function(table) {
    table.increments('id').primary();
    table.integer('sender_id').unsigned().nullable();
    table.integer('receiver_id').unsigned().notNullable();
    table.integer('chat_id').unsigned().nullable(); // Add chat_id column
    table.string('type').notNullable(); // 'message', 'friend_request', 'game_invite', etc.
    table.text('message').notNullable();
    table.boolean('is_read').defaultTo(false);
    table.boolean('is_opened').defaultTo(false);
    table.timestamps(true, true); // created_at, updated_at
    
    // Add indexes for better performance
    table.index(['receiver_id', 'type']);
    table.index(['receiver_id', 'is_read']);
    table.index(['receiver_id', 'is_opened']);
    table.index(['chat_id', 'receiver_id', 'type']);
    
    // Foreign key constraints (optional, if you have users table)
    // table.foreign('sender_id').references('id').inTable('users').onDelete('CASCADE');
    // table.foreign('receiver_id').references('id').inTable('users').onDelete('CASCADE');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('notifications');
};
