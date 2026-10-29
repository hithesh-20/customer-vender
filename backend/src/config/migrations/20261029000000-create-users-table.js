'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users', {
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
      email: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          is: /^[0-9]{10,15}$/,
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          min: 8,
          max: 32,
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
      shop_name: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          len: [2, 100],
        },
      },
      shop_address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      city: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          len: [2, 50],
        },
      },
      state: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          len: [2, 50],
        },
      },
      pincode: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          is: /^[0-9]{6}$/,
        },
      },
      gst_number: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          is: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
        },
      },
      pan_number: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          is: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
        },
      },
      aadhar_number: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          is: /^[0-9]{12}$/,
        },
      },
      profile_image: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isUrl: true,
        },
      },
      business_type: {
        type: DataTypes.STRING,
        allowNull: true,
        values: ['Retail', 'Wholesale', 'Mobile', 'Online', 'Other'],
        defaultValue: 'Retail',
      },
      categories: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: [],
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
      device_token: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'FCM device token for push notifications',
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      is_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      is_online: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      is_onboarded: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      last_active_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      email_verified_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      phone_verified_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      onboarding_completed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      preferences: {
        type: DataTypes.JSONB,
        defaultValue: {
          language: 'en',
          notificationsEnabled: true,
          soundEnabled: true,
          vibrationEnabled: true,
          theme: 'light',
          currency: 'INR',
          autoSyncEnabled: true,
          syncInterval: 5,
        },
      },
      settings: {
        type: DataTypes.JSONB,
        defaultValue: {
          minOrderAmount: 100,
          deliveryRadius: 10,
          deliveryCharge: 50,
          openingTime: '08:00',
          closingTime: '20:00',
          workingDays: [1, 2, 3, 4, 5, 6],
          paymentMethods: ['Cash', 'UPI', 'Bank Transfer', 'Udhaar'],
          homeDelivery: true,
        },
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
    await queryInterface.addIndex('users', ['email'], {
      unique: true,
      where: { email: { [Sequelize.Op.ne]: null } },
    });
    await queryInterface.addIndex('users', ['phone'], { unique: true });
    await queryInterface.addIndex('users', ['uid'], {
      unique: true,
      where: { uid: { [Sequelize.Op.ne]: null } },
    });
    await queryInterface.addIndex('users', ['is_active']);
    await queryInterface.addIndex('users', ['is_verified']);
    await queryInterface.addIndex('users', ['business_type']);
    await queryInterface.addIndex('users', ['city']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('users');
  },
};
