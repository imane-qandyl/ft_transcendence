/**
 * Migration to support multiple characters per user
 * - Removes unique constraint on user_id
 * - Adds is_active column to track which character is currently selected
 * - Adds slot_number to track character slot position
 */

exports.up = async function(knex) {
  // SQLite doesn't support dropping constraints directly, so we need to recreate the table
  // First, check if the columns already exist
  const hasIsActive = await knex.schema.hasColumn('characters', 'is_active');
  const hasSlotNumber = await knex.schema.hasColumn('characters', 'slot_number');

  if (!hasIsActive) {
    await knex.schema.alterTable('characters', (table) => {
      table.boolean('is_active').defaultTo(true);
    });
  }

  if (!hasSlotNumber) {
    await knex.schema.alterTable('characters', (table) => {
      table.integer('slot_number').defaultTo(1);
    });
  }

  // Drop the unique constraint on user_id to allow multiple characters per user
  // SQLite requires raw SQL to drop an index
  try {
    await knex.raw('DROP INDEX IF EXISTS characters_user_id_unique');
  } catch (err) {
    console.log('Note: Could not drop characters_user_id_unique index (may not exist)');
  }

  // Set all existing characters as active and slot 1
  await knex('characters')
    .whereNull('is_active')
    .update({ is_active: true });

  await knex('characters')
    .whereNull('slot_number')
    .update({ slot_number: 1 });
};

exports.down = async function(knex) {
  const hasIsActive = await knex.schema.hasColumn('characters', 'is_active');
  const hasSlotNumber = await knex.schema.hasColumn('characters', 'slot_number');

  if (hasIsActive) {
    await knex.schema.alterTable('characters', (table) => {
      table.dropColumn('is_active');
    });
  }

  if (hasSlotNumber) {
    await knex.schema.alterTable('characters', (table) => {
      table.dropColumn('slot_number');
    });
  }
};
