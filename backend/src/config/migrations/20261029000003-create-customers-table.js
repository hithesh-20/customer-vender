'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('customers', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      uid: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
        comment: 'Firebase UID',
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          is: /^[0-9]{10,15}$/,
        },
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [2, 100],
        },
      },
      profile_image: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isUrl: true,
        },
      },
      date_of_birth: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      gender: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isIn: [['Male', 'Female', 'Other']],
        },
      },
      anniversary: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      addresses: {
        type: DataTypes.JSONB,
        defaultValue: [],
      },
      default_address_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      preferred_language: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'en',
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      tags: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: [],
      },
      total_spent: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      order_count: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      average_order_value: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      first_order_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      last_order_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      loyalty_points: {
        type: DataTypes.JSONB,
        defaultValue: {
          totalPoints: 0,
          availablePoints: 0,
          redeemedPoints: 0,
          expiredPoints: 0,
          transactions: [],
          currentTier: 'bronze',
        },
      },
      loyalty_tier: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'Bronze',
      },
      favorite_products: {
        type: DataTypes.ARRAY(DataTypes.UUID),
        defaultValue: [],
      },
      favorite_categories: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: [],
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      is_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      is_blocked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      referral_code: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      referred_by: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      latitude: {
        type: DataTypes.DOUBLE,
        allowNull: true,
        validate: {
          min: -90,
          max: 90,
        },
      },
      longitude: {
        type: DataTypes.DOUBLE,
        allowNull: true,
        validate: {
          min: -180,
          max: 180,
        },
      },
      current_location: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      is_synced: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      last_synced_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      sync_status: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    });

    // Create indexes
    await queryInterface.addIndex('customers', ['phone'], { unique: true });
    await queryInterface.addIndex('customers', ['email'], {
      unique: true,
      where: { email: { [Sequelize.Op.ne]: null } },
    });
    await queryInterface.addIndex('customers', ['uid'], {
      unique: true,
      where: { uid: { [Sequelize.Op.ne]: null } },
    });
    await queryInterface.addIndex('customers', ['is_active']);
    await queryInterface.addIndex('customers', ['is_verified']);
    await queryInterface.addIndex('customers', ['loyalty_tier']);
    await queryInterface.addIndex('customers', ['referred_by']);
    await queryInterface.addIndex('customers', ['city']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('customers');
  },
};
