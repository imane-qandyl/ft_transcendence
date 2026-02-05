/**
 * Script to create a test user and character for testing
 */

const knex = require("../db");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");

async function createTestData() {
  try {
    // Check if test user exists
    let user = await knex("users").where("email", "test@example.com").first();

    if (!user) {
      // Create test user
      const hashedPassword = await bcrypt.hash("password123", 10);

      const [userId] = await knex("users")
        .insert({
          email: "test@example.com",
          username: "TestPlayer",
          password_hash: hashedPassword,
        })
        .returning("id");

      user = { id: userId };
    }

    // Check if character exists
    const existingCharacter = await knex("characters")
      .where("user_id", user.id)
      .first();

    if (!existingCharacter) {
      // Create character for test user
      await knex("characters").insert({
        id: uuidv4(),
        user_id: user.id,
        name: "TestWarrior",
        level: 5,
        experience: 0,
        coins: 5000,
        max_health: 150,
        attack: 30,
        defense: 20,
        speed: 25,
        elo_rating: 1200,
        wins: 0,
        losses: 0,
        sprite_body: "body_base",
        sprite_hair: "hair_short",
        sprite_outfit: "outfit_basic",
      });
    }

    // Create a second test user for matchmaking
    let user2 = await knex("users").where("email", "test2@example.com").first();

    if (!user2) {
      const hashedPassword = await bcrypt.hash("password123", 10);

      const [userId] = await knex("users")
        .insert({
          email: "test2@example.com",
          username: "TestPlayer2",
          password_hash: hashedPassword,
        })
        .returning("id");

      user2 = { id: userId };
    }

    // Check if second character exists
    const existingCharacter2 = await knex("characters")
      .where("user_id", user2.id)
      .first();

    if (!existingCharacter2) {
      await knex("characters").insert({
        id: uuidv4(),
        user_id: user2.id,
        name: "TestKnight",
        level: 5,
        experience: 0,
        coins: 5000,
        max_health: 140,
        attack: 25,
        defense: 30,
        speed: 20,
        elo_rating: 1150,
        wins: 0,
        losses: 0,
        sprite_body: "body_base",
        sprite_hair: "hair_long",
        sprite_outfit: "outfit_knight",
      });
    }

    process.exit(0);
  } catch (error) {
    console.error("Error creating test data:", error);
    process.exit(1);
  }
}

createTestData();
