const path = require('path');
const knex = require('knex');

const db = knex({
  client: 'sqlite3',
  connection: {
    filename: path.resolve(__dirname, 'db', 'data.sqlite3')
  },
  useNullAsDefault: true
});

module.exports = db;
