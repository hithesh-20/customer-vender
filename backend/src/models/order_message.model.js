const { DataTypes, sequelize } = require('../config/database');

const OrderMessage = sequelize.define(
  'OrderMessage',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    senderId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    senderRole: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [['customer', 'vendor']],
      },
    },
    senderName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    tableName: 'order_messages',
  }
);

module.exports = OrderMessage;
