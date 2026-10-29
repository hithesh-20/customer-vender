const { DataTypes, sequelize } = require('../config/database');

const SupportTicket = sequelize.define(
  'SupportTicket',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    ticketNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    vendorId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Order Issue',
      validate: {
        isIn: [
          ['Order Issue', 'Item Quality', 'Delivery Delay', 'Payment/Billing', 'Account Help'],
        ],
      },
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Open', // Open | In Progress | Resolved
    },
    resolutionNote: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'support_tickets',
  }
);

module.exports = SupportTicket;
