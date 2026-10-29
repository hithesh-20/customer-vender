const { DataTypes, sequelize } = require('../config/database');

const VALID_UNITS = [
  'kg',
  '500 g',
  '250 g',
  '100 g',
  'g',
  'bunch',
  'packet',
  'piece',
  'dozen',
  'liter',
  '500 ml',
];

const Product = sequelize.define(
  'Product',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    vendorId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    kannadaName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Vegetables',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0.01,
      },
    },
    costPrice: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    mrp: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    unit: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'kg',
    },
    stock: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    minOrderQty: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 0.1,
      },
    },
    maxOrderQty: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    minStockAlert: {
      type: DataTypes.FLOAT,
      defaultValue: 5,
    },
    sku: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    barcode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    perishable: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    shelfLifeDays: {
      type: DataTypes.INTEGER,
      defaultValue: 3,
    },
    inStock: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    totalSold: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    tags: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
  },
  {
    tableName: 'products',
    hooks: {
      beforeSave: (product) => {
        const minQty = Number(product.minOrderQty || 1);
        product.inStock = Number(product.stock || 0) >= minQty && product.isActive !== false;
      },
    },
  }
);

Product.VALID_UNITS = VALID_UNITS;

module.exports = Product;
