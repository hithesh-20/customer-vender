const { DataTypes, sequelize } = require('../config/database');

const Category = sequelize.define(
  'Category',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    kannadaName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    icon: {
      type: DataTypes.STRING,
      defaultValue: 'basket',
    },
    color: {
      type: DataTypes.STRING,
      defaultValue: '#15803D',
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: 'categories',
  }
);

Category.DEFAULT_TAXONOMY = [
  {
    slug: 'vegetables',
    name: 'Vegetables',
    kannadaName: 'ತರಕಾರಿಗಳು',
    description: 'Fresh daily vegetables from local street carts and farms',
    icon: 'carrot',
    color: '#15803D',
    sortOrder: 1,
  },
  {
    slug: 'fruits',
    name: 'Fruits',
    kannadaName: 'ಹಣ್ಣುಗಳು',
    description: 'Seasonal and locally harvested fresh fruits',
    icon: 'apple',
    color: '#EA580C',
    sortOrder: 2,
  },
  {
    slug: 'leafy-greens',
    name: 'Leafy Greens',
    kannadaName: 'ಸೊಪ್ಪುಗಳು',
    description: 'Fresh bundles of palak, methi, coriander, curry leaves, and local greens',
    icon: 'leaf',
    color: '#16A34A',
    sortOrder: 3,
  },
  {
    slug: 'spices-masalas',
    name: 'Spices & Masalas',
    kannadaName: 'ಮಸಾಲೆ ಪದಾರ್ಥಗಳು',
    description: 'Whole spices, freshly ground local masalas, ginger, garlic, and chillies',
    icon: 'flame',
    color: '#DC2626',
    sortOrder: 4,
  },
  {
    slug: 'grocery-essentials',
    name: 'Grocery Essentials',
    kannadaName: 'ದಿನಸಿ ಸಾಮಗ್ರಿಗಳು',
    description: 'Rice, pulses, grains, jaggery, oils, and daily kitchen staples',
    icon: 'wheat',
    color: '#D97706',
    sortOrder: 5,
  },
  {
    slug: 'dairy-fresh',
    name: 'Dairy & Fresh',
    kannadaName: 'ಹಾಲು ಮತ್ತು ತಾಜಾ ಉತ್ಪನ್ನಗಳು',
    description: 'Curd, paneer, buttermilk, tender coconut, and fresh daily items',
    icon: 'droplet',
    color: '#0284C7',
    sortOrder: 6,
  },
  {
    slug: 'other-local',
    name: 'Flowers & Local Items',
    kannadaName: 'ಹೂವು ಮತ್ತು ಇತರ ವಸ್ತುಗಳು',
    description: 'Fresh flowers, pooja items, and neighborhood vendor specialties',
    icon: 'sparkles',
    color: '#9333EA',
    sortOrder: 7,
  },
];

module.exports = Category;
