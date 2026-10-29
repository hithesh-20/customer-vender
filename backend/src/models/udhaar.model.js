const { DataTypes, sequelize } = require('../config/database');

const Udhaar = sequelize.define('Udhaar', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  udhaarNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  vendorId: {
    type: DataTypes.UUID,
    allowNull: false,
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
    allowNull: false,
  },
  orderId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  totalAmount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  paidAmount: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  remainingAmount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Active', // Active | Partial | Paid | Overdue
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  paidDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  repaymentHistory: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
}, {
  tableName: 'udhaars',
  hooks: {
    beforeSave: (udhaar) => {
      const rem = Math.max(0, Number(udhaar.totalAmount) - Number(udhaar.paidAmount || 0));
      udhaar.remainingAmount = Number(rem.toFixed(2));
      if (rem <= 0.01) {
        udhaar.status = 'Paid';
        udhaar.remainingAmount = 0;
        if (!udhaar.paidDate) udhaar.paidDate = new Date();
      } else if (udhaar.dueDate && new Date(udhaar.dueDate) < new Date()) {
        udhaar.status = 'Overdue';
      } else if (Number(udhaar.paidAmount || 0) > 0) {
        udhaar.status = 'Partial';
      } else {
        udhaar.status = 'Active';
      }
    },
  },
});

module.exports = Udhaar;
