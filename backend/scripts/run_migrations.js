const db = require('../db');

(async () => {
  try {
    await db.migrate.latest();
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
})();
