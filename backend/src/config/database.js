const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes, Op } = require('sequelize');
const config = require('./config');
const logger = require('../utils/logger');

let sequelizeOptions;

if (config.database.dialect === 'sqlite') {
  if (config.database.storage !== ':memory:') {
    const dir = path.dirname(config.database.storage);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
  sequelizeOptions = {
    dialect: 'sqlite',
    storage: config.database.storage,
    logging: config.database.logging ? (msg) => logger.debug(msg) : false,
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true,
    },
  };
} else {
  sequelizeOptions = {
    dialect: config.database.dialect,
    host: config.database.host,
    port: config.database.port,
    database: config.database.name,
    username: config.database.user,
    password: config.database.password,
    logging: config.database.logging ? (msg) => logger.debug(msg) : false,
    pool: config.database.pool,
    dialectOptions: config.database.dialectOptions,
    timezone: '+05:30',
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true,
    },
  };
}

const sequelize = new Sequelize(sequelizeOptions);

async function testConnection() {
  try {
    await sequelize.authenticate();
    logger.info(`✅ Database connected (${config.database.dialect})`);
    return true;
  } catch (error) {
    logger.error(`❌ Database connection error: ${error.message}`);
    return false;
  }
}

async function syncModels(options = {}) {
  try {
    require('../models');
    await sequelize.sync(options);
    logger.info('✅ Database models synchronized');
    return true;
  } catch (error) {
    logger.error(`❌ Database sync error: ${error.message}`);
    throw error;
  }
}

async function closeConnection() {
  try {
    await sequelize.close();
    logger.info('✅ Database connection closed');
    return true;
  } catch (error) {
    logger.error(`❌ Close connection error: ${error.message}`);
    return false;
  }
}

module.exports = {
  sequelize,
  Sequelize,
  DataTypes,
  Op,
  testConnection,
  syncModels,
  closeConnection,
};
