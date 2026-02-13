module.exports = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: './db/data.sqlite3'
    },
    useNullAsDefault: true,
    migrations: {
      directory: './migrations'
    }
  },
  production: {
    client: 'sqlite3',
    connection: {
      filename: process.env.DATABASE_URL || './db/data.sqlite3'
    },
    useNullAsDefault: true,
    migrations: {
      directory: './migrations'
    }
  }
};

//npx knex migrate:latest