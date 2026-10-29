const { DataTypes, sequelize } = require('../config/database');

const Customer = sequelize.define(
  'Customer',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    vendorId: {
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
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    landmark: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    pincode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    latitude: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    longitude: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    preferredLanguage: {
      type: DataTypes.STRING,
      defaultValue: 'en',
    },
    totalSpent: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    orderCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    udhaarBalance: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    creditLimit: {
      type: DataTypes.FLOAT,
      defaultValue: 5000,
    },
    loyaltyPoints: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    loyaltyTier: {
      type: DataTypes.STRING,
      defaultValue: 'Bronze',
    },
    lastOrderDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: 'customers',
    hooks: {
      beforeSave: (customer) => {
        const pts = Number(customer.loyaltyPoints || 0);
        if (pts >= 1000) customer.loyaltyTier = 'Platinum';
        else if (pts >= 500) customer.loyaltyTier = 'Gold';
        else if (pts >= 200) customer.loyaltyTier = 'Silver';
        else customer.loyaltyTier = 'Bronze';
      },
    },
  }
);

module.exports = Customer;
