'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('orders', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      order_number: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
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
      customer_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'customers',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Pending',
        validate: {
          isIn: [[
            'Pending', 'Confirmed', 'Accepted', 'Prepared', 'Ready for Pickup',
            'Dispatched', 'On the Way', 'Delivered', 'Cancelled', 'Returned', 'Refunded', 'Failed'
          ]],
        },
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Delivery',
        validate: {
          isIn: [['Delivery', 'Pickup', 'Dine In', 'Subscription']],
        },
      },
      subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      discount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      tax: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      tax_rate: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        defaultValue: 0,
        validate: {
          min: 0,
          max: 100,
        },
      },
      delivery_charge: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      paid_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      due_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      payment_method: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isIn: [['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Card', 'Wallet', 'Udhaar', 'Hybrid']],
        },
      },
      payment_status: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'Pending',
        validate: {
          isIn: [['Pending', 'Paid', 'Partial', 'Failed', 'Refunded', 'Cancelled']],
        },
      },
      payment_details: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      delivery_type: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'Standard',
        validate: {
          isIn: [['Standard', 'Express', 'Same Day', 'Scheduled']],
        },
      },
      delivery_address: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      order_date: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
      delivery_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      expected_delivery_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      special_instructions: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      coupon_code: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      coupon_discount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0,
      },
      is_udhaar: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      udhaar_details: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      status_history: {
        type: DataTypes.JSONB,
        defaultValue: [],
      },
      assigned_to: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      delivery_boy_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      vendor_location: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      delivery_location: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      route_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      distance: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      estimated_time: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      accepted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      prepared_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      dispatched_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      delivered_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      cancelled_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      cancellation_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      rating: {
        type: DataTypes.DECIMAL(3, 2),
        allowNull: true,
        validate: {
          min: 0,
          max: 5,
        },
      },
      review: {
        type: DataTypes.TEXT,
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
    await queryInterface.addIndex('orders', ['vendor_id']);
    await queryInterface.addIndex('orders', ['customer_id']);
    await queryInterface.addIndex('orders', ['status']);
    await queryInterface.addIndex('orders', ['order_date']);
    await queryInterface.addIndex('orders', ['delivery_date']);
    await queryInterface.addIndex('orders', ['payment_status']);
    await queryInterface.addIndex('orders', ['payment_method']);
    await queryInterface.addIndex('orders', ['type']);
    await queryInterface.addIndex('orders', ['is_udhaar']);
    await queryInterface.addIndex('orders', ['route_id']);
    await queryInterface.addIndex('orders', ['order_number'], { unique: true });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('orders');
  },
};
