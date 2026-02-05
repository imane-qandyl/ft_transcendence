/**
 * Add critical chance, luck, and stat points columns to characters table
 * Note: These columns are now included in the base migration for fresh installs
 */

exports.up = async function(knex) {
  const hasCritical = await knex.schema.hasColumn('characters', 'critical');
  const hasLuck = await knex.schema.hasColumn('characters', 'luck');
  const hasStatPoints = await knex.schema.hasColumn('characters', 'stat_points');

  if (!hasCritical || !hasLuck || !hasStatPoints) {
    return knex.schema.alterTable('characters', (table) => {
      if (!hasCritical) table.integer('critical').defaultTo(10);
      if (!hasLuck) table.integer('luck').defaultTo(5);
      if (!hasStatPoints) table.integer('stat_points').defaultTo(0);
    });
  }
};

exports.down = async function(knex) {
  const hasCritical = await knex.schema.hasColumn('characters', 'critical');
  const hasLuck = await knex.schema.hasColumn('characters', 'luck');
  const hasStatPoints = await knex.schema.hasColumn('characters', 'stat_points');

  if (hasCritical || hasLuck || hasStatPoints) {
    return knex.schema.alterTable('characters', (table) => {
      if (hasCritical) table.dropColumn('critical');
      if (hasLuck) table.dropColumn('luck');
      if (hasStatPoints) table.dropColumn('stat_points');
    });
  }
};
