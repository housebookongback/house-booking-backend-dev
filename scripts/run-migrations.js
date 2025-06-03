#!/usr/bin/env node

const { Sequelize } = require('sequelize');
const { Umzug, SequelizeStorage } = require('umzug');
require('dotenv').config();

// Get DB connection params from environment
const { DB_HOST, DB_NAME, DB_USER, DB_PASS, DB_PORT } = process.env;

// Create Sequelize instance
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: 'postgres',
  logging: console.log
});

// Create Umzug instance for migrations
const umzug = new Umzug({
  migrations: {
    // Specify the path to your migration files
    glob: 'migrations/*.js',
    resolve: ({ name, path, context }) => {
      // Load the migration file
      const migration = require(path);
      return {
        name,
        up: async () => migration.up(context, Sequelize),
        down: async () => migration.down(context, Sequelize),
      };
    },
  },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize }),
  logger: console,
});

// Run migrations
(async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    // Run pending migrations
    const migrations = await umzug.up();
    
    if (migrations.length === 0) {
      console.log('No migrations were executed. Database schema is already up to date.');
    } else {
      console.log(`Executed ${migrations.length} migrations:`);
      migrations.forEach(migration => console.log(`- ${migration.name}`));
    }

    // Close the connection
    await sequelize.close();
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }
})(); 