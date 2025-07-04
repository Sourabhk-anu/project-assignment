import { DataTypes } from 'sequelize';
import { sequelize } from '../database/connection.js';

export const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  sku: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active'
  },
  stock_quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  enterprise_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Enterprise',
      key: 'id'
    }
  }
}, {
  tableName: 'Product',
  indexes: [
    {
      fields: ['sku']
    },
    {
      fields: ['enterprise_id']
    },
    {
      fields: ['category']
    },
    {
      fields: ['status']
    }
  ]
});