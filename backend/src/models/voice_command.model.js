const { DataTypes, sequelize } = require('../config/database');

const VoiceCommand = sequelize.define('VoiceCommand', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  vendorId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  transcript: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  language: {
    type: DataTypes.STRING,
    defaultValue: 'kn',
  },
  intent: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  confidence: {
    type: DataTypes.FLOAT,
    defaultValue: 0.92,
  },
  entities: {
    type: DataTypes.JSON,
    defaultValue: {},
  },
  responseText: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  responseKannada: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  executedAction: {
    type: DataTypes.JSON,
    defaultValue: {},
  },
}, {
  tableName: 'voice_commands',
});

module.exports = VoiceCommand;
