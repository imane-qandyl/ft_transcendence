exports.up = async function(knex) {
  await knex.schema.alterTable('messages', function(table) {
    table.boolean('is_read').defaultTo(false);
    table.timestamp('read_at').nullable();
  });
};

exports.down = async function(knex) {
  await knex.schema.alterTable('messages', function(table) {
    table.dropColumn('is_read');
    table.dropColumn('read_at');
  });
};
