const { DataTypes, sequelize } = require('../config/database');

const CartItem = sequelize.define(
  'CartItem',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    cartId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 0.1,
      },
    },
    unitPriceSnapshot: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
  },
  {
    tableName: 'cart_items',
    indexes: [
      {
        unique: true,
        fields: ['cart_id', 'product_id'],
      },
    ],
  }
);

module.exports = CartItem;
