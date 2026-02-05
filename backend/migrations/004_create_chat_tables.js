exports.up = async function(knex) {
  // Chats table
  await knex.schema.createTable('chats', function(table) {
    table.increments('id').primary();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // Chat participants join table
  await knex.schema.createTable('chat_participants', function(table) {
    table.increments('id').primary();
    table.integer('chat_id').unsigned().notNullable().references('id').inTable('chats').onDelete('CASCADE');
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.unique(['chat_id', 'user_id']);
    table.timestamp('joined_at').defaultTo(knex.fn.now());
  });

  // Messages table
  await knex.schema.createTable('messages', function(table) {
    table.increments('id').primary();
    table.integer('chat_id').unsigned().notNullable().references('id').inTable('chats').onDelete('CASCADE');
    table.integer('sender_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.text('content').notNullable();
    table.boolean('blocks_active').defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // Blocks table (who blocked whom)
  await knex.schema.createTable('blocks', function(table) {
    table.increments('id').primary();
    table.integer('blocker_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('blocked_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.unique(['blocker_id', 'blocked_id']);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('blocks');
  await knex.schema.dropTableIfExists('messages');
  await knex.schema.dropTableIfExists('chat_participants');
  await knex.schema.dropTableIfExists('chats');
};
