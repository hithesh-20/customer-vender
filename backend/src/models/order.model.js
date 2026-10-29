const { DataTypes, sequelize } = require('../config/database');

const VALID_ORDER_STATUSES = [
  'Placed',
  'Accepted',
  'Preparing',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
];

const Order = sequelize.define(
  'Order',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    orderNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    idempotencyKey: {
      type: DataTypes.STRING,
      allowNull: true,
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
    customerId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    customerName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    customerPhone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Placed',
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Delivery', // Delivery | Pickup | Walk-in
    },
    source: {
      type: DataTypes.STRING,
      defaultValue: 'customer_app', // customer_app | pos | voice
    },
    subtotal: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    discount: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    tax: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    deliveryCharge: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    total: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    estimatedProfit: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    paidAmount: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    dueAmount: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    paymentMethod: {
      type: DataTypes.STRING,
      defaultValue: 'COD', // COD | ONLINE | PAY_AT_PICKUP | Cash | Udhaar
    },
    paymentStatus: {
      type: DataTypes.STRING,
      defaultValue: 'Pending', // Pending | Paid | Failed | Refunded | Partial
    },
    isUdhaar: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    deliveryAddress: {
      type: DataTypes.JSON,
      defaultValue: {},
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    cancellationReason: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    cancelledBy: {
      type: DataTypes.STRING,
      allowNull: true, // customer | vendor
    },
    orderDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    deliveredAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    statusHistory: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
  },
  {
    tableName: 'orders',
  }
);

Order.VALID_ORDER_STATUSES = VALID_ORDER_STATUSES;

module.exports = Order;
