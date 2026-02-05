/**
 * Add selected_character column to characters table
 * Note: This column is now included in the base migration for fresh installs
 */

exports.up = async function(knex) {
  const hasColumn = await knex.schema.hasColumn('characters', 'selected_character');
  if (!hasColumn) {
    return knex.schema.alterTable('characters', (table) => {
      table.string('selected_character').defaultTo('pink');
    });
  }
};

exports.down = async function(knex) {
  const hasColumn = await knex.schema.hasColumn('characters', 'selected_character');
  if (hasColumn) {
    return knex.schema.alterTable('characters', (table) => {
      table.dropColumn('selected_character');
    });
  }
};
