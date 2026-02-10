/**
 * Cleanup Migration (REMOVED SYSTEMS)
 * Drops tables from removed systems: territories, crimes, gangs, items, achievements.
 * This migration drops the tables if they exist from a previous run.
 */

exports.up = function (knex) {
  return knex.schema
    .dropTableIfExists('gang_members')
    .dropTableIfExists('gangs')
    .dropTableIfExists('character_resources')
    .dropTableIfExists('crime_attempts')
    .dropTableIfExists('crime_activities')
    .dropTableIfExists('territory_battles')
    .dropTableIfExists('territory_ownership')
    .dropTableIfExists('territories')
    .dropTableIfExists('character_achievements')
    .dropTableIfExists('achievements')
    .dropTableIfExists('character_equipment')
    .dropTableIfExists('character_inventory')
    .dropTableIfExists('items')
    .dropTableIfExists('tournament_players')
    .dropTableIfExists('tournaments');
};

exports.down = function (knex) {
  // No-op: these tables are no longer part of the application
  return Promise.resolve();
};
