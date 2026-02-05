/**
 * Game Database Schema - Street Pixel Wars (SQLite Compatible)
 * Creates all necessary tables for the PvP combat game
 */

const { v4: uuidv4 } = require("uuid");

exports.up = function (knex) {
  return (
    knex.schema
      // Characters table - player game profiles
      .createTable("characters", (table) => {
        table
          .string("id", 36)
          .primary()
          .defaultTo(knex.raw("(lower(hex(randomblob(16))))"));
        table
          .string("user_id", 36)
          .notNullable()
          .references("id")
          .inTable("users")
          .onDelete("CASCADE");
        table.string("name", 50).notNullable();
        table.integer("level").defaultTo(1);
        table.integer("experience").defaultTo(0);
        table.integer("coins").defaultTo(1000);
        table.integer("max_health").defaultTo(100);
        table.integer("attack").defaultTo(20);
        table.integer("defense").defaultTo(10);
        table.integer("speed").defaultTo(15);
        table.integer("critical").defaultTo(10);
        table.integer("luck").defaultTo(5);
        table.integer("stat_points").defaultTo(0);
        table.integer("elo_rating").defaultTo(1000);
        table.integer("wins").defaultTo(0);
        table.integer("losses").defaultTo(0);
        table.string("sprite_body").defaultTo("pink");
        table.string("sprite_hair").defaultTo("hair_short");
        table.string("sprite_outfit").defaultTo("outfit_basic");
        table.string("selected_character").defaultTo("pink");
        table.string("bonus_type").defaultTo("balanced");
        table.boolean("is_active").defaultTo(true);
        table.integer("slot_number").defaultTo(1);
        table.timestamps(true, true);
        // Removed unique constraint on user_id to allow multiple characters
      })

      // Items master table
      .createTable("items", (table) => {
        table
          .string("id", 36)
          .primary()
          .defaultTo(knex.raw("(lower(hex(randomblob(16))))"));
        table.string("name", 100).notNullable();
        table.string("type", 50).notNullable(); // weapon, armor, accessory
        table.string("slot", 50).notNullable(); // head, body, weapon, shield, boots, accessory
        table.string("rarity", 20).defaultTo("common"); // common, rare, epic, legendary
        table.integer("attack_bonus").defaultTo(0);
        table.integer("defense_bonus").defaultTo(0);
        table.integer("health_bonus").defaultTo(0);
        table.integer("speed_bonus").defaultTo(0);
        table.integer("level_required").defaultTo(1);
        table.integer("price").notNullable();
        table.string("sprite_key").notNullable();
        table.text("description");
        table.timestamps(true, true);
      })

      // Character inventory
      .createTable("character_inventory", (table) => {
        table
          .string("id", 36)
          .primary()
          .defaultTo(knex.raw("(lower(hex(randomblob(16))))"));
        table
          .string("character_id", 36)
          .notNullable()
          .references("id")
          .inTable("characters")
          .onDelete("CASCADE");
        table
          .string("item_id", 36)
          .notNullable()
          .references("id")
          .inTable("items")
          .onDelete("CASCADE");
        table.integer("quantity").defaultTo(1);
        table.timestamps(true, true);
        table.unique(["character_id", "item_id"]);
      })

      // Character equipment
      .createTable("character_equipment", (table) => {
        table
          .string("id", 36)
          .primary()
          .defaultTo(knex.raw("(lower(hex(randomblob(16))))"));
        table
          .string("character_id", 36)
          .notNullable()
          .references("id")
          .inTable("characters")
          .onDelete("CASCADE");
        table.string("slot", 50).notNullable(); // head, body, weapon, shield, boots, accessory
        table
          .string("item_id", 36)
          .references("id")
          .inTable("items")
          .onDelete("SET NULL");
        table.timestamps(true, true);
        table.unique(["character_id", "slot"]);
      })

      // Match history
      .createTable("game_matches", (table) => {
        table
          .string("id", 36)
          .primary()
          .defaultTo(knex.raw("(lower(hex(randomblob(16))))"));
        table
          .string("player1_id", 36)
          .notNullable()
          .references("id")
          .inTable("characters");
        table
          .string("player2_id", 36)
          .notNullable()
          .references("id")
          .inTable("characters");
        table.string("winner_id", 36).references("id").inTable("characters");
        table.string("match_type", 50).defaultTo("ranked"); // ranked, friendly, tournament
        table.integer("duration_seconds");
        table.integer("player1_damage_dealt").defaultTo(0);
        table.integer("player2_damage_dealt").defaultTo(0);
        table.integer("player1_elo_change").defaultTo(0);
        table.integer("player2_elo_change").defaultTo(0);
        table.integer("winner_xp");
        table.integer("winner_coins");
        table.timestamp("played_at").defaultTo(knex.fn.now());
        table.timestamps(true, true);
      })

      // Achievements
      .createTable("achievements", (table) => {
        table
          .string("id", 36)
          .primary()
          .defaultTo(knex.raw("(lower(hex(randomblob(16))))"));
        table.string("name", 100).notNullable().unique();
        table.text("description").notNullable();
        table.string("icon", 255);
        table.integer("xp_reward").defaultTo(0);
        table.integer("coin_reward").defaultTo(0);
        table.timestamps(true, true);
      })

      // Character achievements
      .createTable("character_achievements", (table) => {
        table
          .string("id", 36)
          .primary()
          .defaultTo(knex.raw("(lower(hex(randomblob(16))))"));
        table
          .string("character_id", 36)
          .notNullable()
          .references("id")
          .inTable("characters")
          .onDelete("CASCADE");
        table
          .string("achievement_id", 36)
          .notNullable()
          .references("id")
          .inTable("achievements")
          .onDelete("CASCADE");
        table.timestamp("unlocked_at").defaultTo(knex.fn.now());
        table.timestamps(true, true);
        table.unique(["character_id", "achievement_id"]);
      })
  );
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists("character_achievements")
    .dropTableIfExists("achievements")
    .dropTableIfExists("game_matches")
    .dropTableIfExists("character_equipment")
    .dropTableIfExists("character_inventory")
    .dropTableIfExists("items")
    .dropTableIfExists("characters");
};
