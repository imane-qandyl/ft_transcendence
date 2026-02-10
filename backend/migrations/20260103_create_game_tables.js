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
  );
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists("game_matches")
    .dropTableIfExists("characters");
};
