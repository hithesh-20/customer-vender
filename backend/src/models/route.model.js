const { DataTypes, sequelize } = require('../config/database');

const Route = sequelize.define('Route', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  routeNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  vendorId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Planned', // Planned | In Progress | Completed
  },
  vehicleType: {
    type: DataTypes.STRING,
    defaultValue: 'Two-Wheeler', // Two-Wheeler | E-Rickshaw | Mini-Truck
  },
  startLocation: {
    type: DataTypes.JSON,
    defaultValue: {},
  },
  stopsData: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  totalDistanceKm: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  unoptimizedDistanceKm: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  distanceSavedKm: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  estimatedMinutes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  fuelCostInr: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  fuelSavedInr: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  estimatedRevenueInr: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  totalStops: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  completedStops: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  algorithm: {
    type: DataTypes.STRING,
    defaultValue: 'Nearest-Neighbor + 2-Opt Local Search',
  },
  scheduledDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'routes',
});

module.exports = Route;
