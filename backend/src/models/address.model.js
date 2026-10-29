const { DataTypes, sequelize } = require('../config/database');

const Address = sequelize.define(
  'Address',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    label: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Home',
      validate: {
        isIn: [['Home', 'Work', 'Other']],
      },
    },
    recipientName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    recipientPhone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    addressLine1: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    addressLine2: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    landmark: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    area: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    state: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Karnataka',
    },
    pincode: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        is: /^[1-9][0-9]{5}$/,
      },
    },
    latitude: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    longitude: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    deliveryInstructions: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: 'addresses',
  }
);

module.exports = Address;
