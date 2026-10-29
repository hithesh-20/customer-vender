const { DataTypes, sequelize } = require('../config/database');

const Payment = sequelize.define(
  'Payment',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    paymentNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    vendorId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    customerUserId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    udhaarId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    customerName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'INR',
    },
    paymentMethod: {
      type: DataTypes.STRING,
      defaultValue: 'COD',
    },
    paymentGateway: {
      type: DataTypes.STRING,
      defaultValue: 'Cash on Delivery',
    },
    gatewayOrderId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    transactionId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'Pending', // Pending | Completed | Failed | Refunded
    },
    failureReason: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    paymentDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {},
    },
  },
  {
    tableName: 'payments',
  }
);

module.exports = Payment;
