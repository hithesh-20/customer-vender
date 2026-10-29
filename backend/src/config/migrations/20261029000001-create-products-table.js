'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('products', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
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
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [2, 200],
        },
      },
      kannada_name: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          len: [2, 200],
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      kannada_description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      category: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [2, 100],
        },
      },
      sub_categories: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: [],
      },
      brand: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          len: [2, 100],
        },
      },
      unit: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Piece',
        validate: {
          isIn: [['Piece', 'kg', 'gram', 'Liter', 'ml', 'Dozen', 'Box', 'Packet', 'Bottle', 'Can', 'Meter', 'cm']],
        },
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      mrp: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        validate: {
          min: 0,
        },
      },
      cost_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        validate: {
          min: 0,
        },
      },
      stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      min_stock: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 5,
        validate: {
          min: 0,
        },
      },
      max_stock: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          min: 0,
        },
      },
      in_stock: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      is_featured: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      is_new: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      discount: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        defaultValue: 0,
        validate: {
          min: 0,
          max: 100,
        },
      },
      discount_type: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'Percentage',
        validate: {
          isIn: [['Percentage', 'Fixed']],
        },
      },
      discount_start: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      discount_end: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      rating: {
        type: DataTypes.DECIMAL(3, 2),
        allowNull: true,
        defaultValue: 0,
        validate: {
          min: 0,
          max: 5,
        },
      },
      review_count: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      images: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: [],
      },
      thumbnail: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isUrl: true,
        },
      },
      tags: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: [],
      },
      attributes: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      inventory_info: {
        type: DataTypes.JSONB,
        defaultValue: {
          totalStock: 0,
          reservedStock: 0,
          availableStock: 0,
          lowStockThreshold: 5,
          supplierId: null,
          supplierName: null,
          supplierPrice: 0,
          barcode: null,
          sku: null,
          hsnCode: null,
          reorderLevel: 10,
          maxStockLevel: 100,
          stockHistory: [],
        },
      },
      sales_data: {
        type: DataTypes.JSONB,
        defaultValue: {
          totalSold: 0,
          totalRevenue: 0,
          totalProfit: 0,
          views: 0,
          wishlists: 0,
          cartAdds: 0,
          dailySales: [],
          weeklySales: [],
          monthlySales: [],
          categorySales: {},
          locationSales: {},
        },
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
    await queryInterface.addIndex('products', ['vendor_id']);
    await queryInterface.addIndex('products', ['category']);
    await queryInterface.addIndex('products', ['is_active']);
    await queryInterface.addIndex('products', ['is_featured']);
    await queryInterface.addIndex('products', ['in_stock']);
    await queryInterface.addIndex('products', ['name']);
    await queryInterface.addIndex('products', ['tags']);
    await queryInterface.addIndex('products', ['created_at']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('products');
  },
};
