const { Umzug, SequelizeStorage } = require('umzug');
const path = require('path');
const { sequelize } = require('../config/database');
const logger = require('../utils/logger');
const config = require('../config/config');

async function runMigrations() {
  try {
    logger.info('🚀 Starting database migrations...');

    const umzug = new Umzug({
      migrations: {
        glob: path.join(__dirname, '../config/migrations', '*.js'),
        resolve: ({ name, path: migrationPath, context }) => {
          const migration = require(migrationPath);
          return {
            name,
            up: async () => migration.up(context, sequelize),
            down: async () => migration.down(context, sequelize),
          };
        },
      },
      storage: new SequelizeStorage({
        sequelize,
        tableName: 'migrations',
      }),
      context: sequelize.getQueryInterface(),
      logger: {
        info: (message) => logger.info(message),
        warn: (message) => logger.warn(message),
        error: (message) => logger.error(message),
        debug: (message) => logger.debug(message),
      },
    });

    // Check for pending migrations
    const pendingMigrations = await umzug.pending();
    
    if (pendingMigrations.length === 0) {
      logger.info('✅ No pending migrations');
      return;
    }

    logger.info(`📋 Found ${pendingMigrations.length} pending migration(s):`);
    pendingMigrations.forEach((migration) => {
      logger.info(`  - ${migration.file}`);
    });

    // Run migrations
    const executedMigrations = await umzug.up();

    logger.info(`✅ Successfully executed ${executedMigrations.length} migration(s):`);
    executedMigrations.forEach((migration) => {
      logger.info(`  - ${migration.file}`);
    });

    // Log all executed migrations
    const allMigrations = await umzug.executed();
    logger.info(`\n📊 Total migrations: ${allMigrations.length}`);
    allMigrations.forEach((migration) => {
      logger.info(`  ✓ ${migration.file}`);
    });

    return true;
  } catch (error) {
    logger.error(`❌ Migration error: ${error.message}`);
    logger.error(error.stack);
    throw error;
  }
}

async function rollbackMigration(step = 1) {
  try {
    logger.info(`🔙 Rolling back ${step} migration(s)...`);

    const umzug = new Umzug({
      migrations: {
        glob: path.join(__dirname, '../config/migrations', '*.js'),
        resolve: ({ name, path: migrationPath, context }) => {
          const migration = require(migrationPath);
          return {
            name,
            up: async () => migration.up(context, sequelize),
            down: async () => migration.down(context, sequelize),
          };
        },
      },
      storage: new SequelizeStorage({
        sequelize,
        tableName: 'migrations',
      }),
      context: sequelize.getQueryInterface(),
      logger: {
        info: (message) => logger.info(message),
        warn: (message) => logger.warn(message),
        error: (message) => logger.error(message),
        debug: (message) => logger.debug(message),
      },
    });

    const rolledBackMigrations = await umzug.down({ step });

    logger.info(`✅ Successfully rolled back ${rolledBackMigrations.length} migration(s):`);
    rolledBackMigrations.forEach((migration) => {
      logger.info(`  - ${migration.file}`);
    });

    return true;
  } catch (error) {
    logger.error(`❌ Rollback error: ${error.message}`);
    logger.error(error.stack);
    throw error;
  }
}

async function listMigrations() {
  try {
    const umzug = new Umzug({
      migrations: {
        glob: path.join(__dirname, '../config/migrations', '*.js'),
        resolve: ({ name, path: migrationPath, context }) => {
          const migration = require(migrationPath);
          return {
            name,
            up: async () => migration.up(context, sequelize),
            down: async () => migration.down(context, sequelize),
          };
        },
      },
      storage: new SequelizeStorage({
        sequelize,
        tableName: 'migrations',
      }),
      context: sequelize.getQueryInterface(),
      logger: {
        info: (message) => logger.info(message),
        warn: (message) => logger.warn(message),
        error: (message) => logger.error(message),
        debug: (message) => logger.debug(message),
      },
    });

    const executedMigrations = await umzug.executed();
    const pendingMigrations = await umzug.pending();

    logger.info('\n📊 Migration Status:');
    logger.info(`  Executed: ${executedMigrations.length}`);
    logger.info(`  Pending: ${pendingMigrations.length}\n`);

    if (executedMigrations.length > 0) {
      logger.info('✅ Executed Migrations:');
      executedMigrations.forEach((migration) => {
        logger.info(`  - ${migration.file}`);
      });
    }

    if (pendingMigrations.length > 0) {
      logger.info('\n⏳ Pending Migrations:');
      pendingMigrations.forEach((migration) => {
        logger.info(`  - ${migration.file}`);
      });
    }

    return {
      executed: executedMigrations,
      pending: pendingMigrations,
    };
  } catch (error) {
    logger.error(`❌ List migrations error: ${error.message}`);
    throw error;
  }
}

// Main function
async function main() {
  try {
    // Initialize database connection
    const dbConnected = await require('../config/database').testConnection();
    if (!dbConnected) {
      logger.error('❌ Database connection failed. Please check your database configuration.');
      process.exit(1);
    }

    // Parse command line arguments
    const args = process.argv.slice(2);
    const command = args[0];
    const step = args[1] ? parseInt(args[1]) : 1;

    switch (command) {
      case 'up':
      case 'migrate':
        await runMigrations();
        break;
      case 'down':
      case 'rollback':
        await rollbackMigration(step);
        break;
      case 'list':
      case 'status':
        await listMigrations();
        break;
      case 'create':
        // Create a new migration file
        const name = args[1];
        if (!name) {
          logger.error('❌ Please provide a migration name');
          logger.info('Usage: npm run migrate create <migration_name>');
          process.exit(1);
        }
        await createMigration(name);
        break;
      default:
        logger.info('\n📖 Database Migration CLI');
        logger.info('');
        logger.info('Usage:');
        logger.info('  npm run migrate [command] [options]');
        logger.info('');
        logger.info('Commands:');
        logger.info('  up, migrate    Run all pending migrations');
        logger.info('  down           Rollback the last migration');
        logger.info('  down [n]      Rollback the last n migrations');
        logger.info('  list, status   List all migrations and their status');
        logger.info('  create [name]  Create a new migration file');
        logger.info('');
        process.exit(0);
    }

    // Close database connection
    await require('../config/database').closeConnection();
    process.exit(0);
  } catch (error) {
    logger.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

// Create a new migration file
async function createMigration(name) {
  try {
    const fs = require('fs');
    const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
    const fileName = `${timestamp}-${name}.js`;
    const filePath = path.join(__dirname, '../config/migrations', fileName);

    const template = `'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add your migration code here
    // Example:
    // await queryInterface.createTable('table_name', {
    //   id: {
    //     type: Sequelize.UUID,
    //     defaultValue: Sequelize.UUIDV4,
    //     primaryKey: true,
    //   },
    //   // ... other fields
    // });
  },

  down: async (queryInterface) => {
    // Add your rollback code here
    // Example:
    // await queryInterface.dropTable('table_name');
  },
};
`;

    if (!fs.existsSync(path.dirname(filePath))) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
    }

    fs.writeFileSync(filePath, template);
    logger.info(`✅ Created migration file: ${fileName}`);
    logger.info(`   Location: ${filePath}`);

    return true;
  } catch (error) {
    logger.error(`❌ Create migration error: ${error.message}`);
    throw error;
  }
}

// Run main function
main();
