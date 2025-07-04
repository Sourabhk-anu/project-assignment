import { DataTypes } from 'sequelize';
import { sequelize } from '../database/connection.js';

export const RolePermission = sequelize.define('RolePermission', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  role_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Role',
      key: 'id'
    }
  },
  module: {
    type: DataTypes.ENUM(
      'dashboard',
      'users',
      'roles',
      'enterprises',
      'employees',
      'products',
      'reports'
    ),
    allowNull: false
  },
  can_create: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  can_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  can_update: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  can_delete: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'RolePermission',
  indexes: [
    {
      fields: ['role_id']
    },
    {
      fields: ['module']
    },
    {
      unique: true,
      fields: ['role_id', 'module']
    }
  ]
});