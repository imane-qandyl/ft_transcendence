/**
 * Add bonus_type column to characters table
 * This stores the class bonus type (balanced, tank, brawler, attacker, crit, lucky)
 */

exports.up = async function(knex) {
  const hasColumn = await knex.schema.hasColumn('characters', 'bonus_type');
  if (!hasColumn) {
    return knex.schema.alterTable('characters', (table) => {
      table.string('bonus_type').defaultTo('balanced');
    });
  }
};

exports.down = async function(knex) {
  const hasColumn = await knex.schema.hasColumn('characters', 'bonus_type');
  if (hasColumn) {
    return knex.schema.alterTable('characters', (table) => {
      table.dropColumn('bonus_type');
    });
  }
};
