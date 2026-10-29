'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('payments', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      payment_number: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      order_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'orders',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      customer_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'customers',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      vendor_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0,
        },
      },
      currency: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'INR',
      },
      payment_method: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isIn: [['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Card', 'Wallet', 'Udhaar', 'Hybrid']],
        },
      },
      payment_gateway: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isIn: [['Razorpay', 'Paytm', 'PhonePe', 'Google Pay', 'PayPal', 'Stripe', 'Manual', 'UPI', 'Bank Transfer', 'Cash', 'Wallet']],
        },
      },
      transaction_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      reference_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Pending',
        validate: {
          isIn: [['Pending', 'Initiated', 'Processing', 'Completed', 'Failed', 'Cancelled', 'Refunded', 'Partial Refund']],
        },
      },
      payment_date: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
      processed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      upi_details: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      bank_details: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      card_details: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      wallet_details: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      cash_details: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      udhaar_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      splits: {
        type: DataTypes.JSONB,
        defaultValue: [],
      },
      gateway_fee: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0,
      },
      tax: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0,
      },
      total_debited: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      refund: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      metadata: {
        type: DataTypes.JSONB,
        defaultValue: {},
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
    await queryInterface.addIndex('payments', ['order_id']);
    await queryInterface.addIndex('payments', ['customer_id']);
    await queryInterface.addIndex('payments', ['vendor_id']);
    await queryInterface.addIndex('payments', ['status']);
    await queryInterface.addIndex('payments', ['payment_method']);
    await queryInterface.addIndex('payments', ['payment_date']);
    await queryInterface.addIndex('payments', ['transaction_id']);
    await queryInterface.addIndex('payments', ['payment_number'], { unique: true });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('payments');
  },
};
