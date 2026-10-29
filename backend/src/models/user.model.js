const bcrypt = require('bcryptjs');
const { DataTypes, sequelize } = require('../config/database');

const VALID_VENDOR_TYPES = [
  'Street Cart',
  'Bicycle Vendor',
  'Motorcycle Vendor',
  'Street Stall',
  'Neighborhood Shop',
];

const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'customer',
      validate: {
        isIn: [['customer', 'vendor']],
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    shopName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    shopNameKannada: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      validate: {
        isOptionalEmail(val) {
          if (val !== null && val !== undefined && val !== '') {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
              throw new Error('Invalid email address');
            }
          }
        },
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    vendorType: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isValidVendorType(val) {
          if (val && !VALID_VENDOR_TYPES.includes(val)) {
            throw new Error(`Vendor type must be one of: ${VALID_VENDOR_TYPES.join(', ')}`);
          }
        },
      },
    },
    businessCategory: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    serviceArea: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    language: {
      type: DataTypes.STRING,
      defaultValue: 'en',
    },
    shopAddress: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    state: {
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
    upiId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    gstin: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    profileImage: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    isOnline: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    lastOnlineAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    rating: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: null,
    },
    reviewCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    totalOrders: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    totalRevenue: {
      type: DataTypes.DOUBLE,
      defaultValue: 0,
    },
    preferences: {
      type: DataTypes.JSON,
      defaultValue: {
        language: 'en',
        orderUpdates: true,
        supportUpdates: true,
      },
    },
    settings: {
      type: DataTypes.JSON,
      defaultValue: {
        homeDelivery: true,
        pickupAvailable: true,
        deliveryRadiusKm: 5,
        servicePincodes: [],
        minOrderAmount: 0,
        deliveryCharge: 20,
        freeDeliveryAbove: 300,
        estimatedPrepMinutes: null,
        operatingHours: null,
        codEnabled: true,
        onlinePaymentEnabled: false,
        voiceNotifications: true,
        lowStockAlerts: true,
        udhaarReminders: true,
      },
    },
  },
  {
    tableName: 'users',
    hooks: {
      beforeCreate: async (user) => {
        if (user.email === '') user.email = null;
        if (user.password && !user.password.startsWith('$2')) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      },
      beforeUpdate: async (user) => {
        if (user.email === '') user.email = null;
        if (user.changed('password') && user.password && !user.password.startsWith('$2')) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      },
    },
  }
);

User.VALID_VENDOR_TYPES = VALID_VENDOR_TYPES;

User.prototype.comparePassword = async function comparePassword(candidatePassword) {
  if (!candidatePassword || !this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

User.prototype.toSafeJSON = function toSafeJSON() {
  const values = { ...this.get() };
  delete values.password;
  return values;
};

User.prototype.toPublicVendorJSON = function toPublicVendorJSON() {
  return {
    id: this.id,
    name: this.name,
    shopName: this.shopName || this.name,
    shopNameKannada: this.shopNameKannada || null,
    vendorType: this.vendorType || 'Street Stall',
    businessCategory: this.businessCategory || null,
    description: this.description || null,
    serviceArea: this.serviceArea || null,
    phone: this.phone,
    shopAddress: this.shopAddress || null,
    city: this.city || null,
    state: this.state || null,
    pincode: this.pincode || null,
    latitude: typeof this.latitude === 'number' ? this.latitude : null,
    longitude: typeof this.longitude === 'number' ? this.longitude : null,
    profileImage: this.profileImage || null,
    isOnline: Boolean(this.isOnline),
    lastOnlineAt: this.lastOnlineAt || null,
    rating: this.reviewCount > 0 && typeof this.rating === 'number' ? this.rating : null,
    reviewCount: this.reviewCount || 0,
    settings: {
      homeDelivery: this.settings?.homeDelivery !== false,
      pickupAvailable: this.settings?.pickupAvailable !== false,
      deliveryRadiusKm:
        typeof this.settings?.deliveryRadiusKm === 'number' ? this.settings.deliveryRadiusKm : 5,
      servicePincodes: Array.isArray(this.settings?.servicePincodes)
        ? this.settings.servicePincodes
        : [],
      minOrderAmount:
        typeof this.settings?.minOrderAmount === 'number' ? this.settings.minOrderAmount : 0,
      deliveryCharge:
        typeof this.settings?.deliveryCharge === 'number' ? this.settings.deliveryCharge : 0,
      freeDeliveryAbove:
        typeof this.settings?.freeDeliveryAbove === 'number'
          ? this.settings.freeDeliveryAbove
          : null,
      estimatedPrepMinutes:
        typeof this.settings?.estimatedPrepMinutes === 'number'
          ? this.settings.estimatedPrepMinutes
          : null,
      operatingHours: this.settings?.operatingHours || null,
      codEnabled: this.settings?.codEnabled !== false,
    },
  };
};

module.exports = User;
