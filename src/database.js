const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../database.sqlite'),
  logging: false
});

const Item = sequelize.define('Item', {
  appid: {
    type: DataTypes.STRING,
    allowNull: false
  },
  market_hash_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lowest_price: {
    type: DataTypes.STRING,
    allowNull: true
  },
  median_price: {
    type: DataTypes.STRING,
    allowNull: true
  },
  volume: {
    type: DataTypes.STRING,
    allowNull: true
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  lastUpdated: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

// Создаем таблицу, если она не существует
sequelize.sync();

module.exports = { sequelize, Item }; 