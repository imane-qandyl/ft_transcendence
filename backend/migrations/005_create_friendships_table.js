exports.up = async function(knex) {
  // Create a dedicated friendships table to match the application's expectations
  const exists = await knex.schema.hasTable('friendships');
  if (!exists) {
    await knex.schema.createTable('friendships', function(table) {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.integer('friend_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
      // Use a plain string for status to avoid enum issues across DB engines
      table.string('status').notNullable().defaultTo('pending');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('friendships');
};
