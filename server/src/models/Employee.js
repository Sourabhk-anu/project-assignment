import { DataTypes } from 'sequelize';
import { sequelize } from '../database/connection.js';

export const Employee = sequelize.define('Employee', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  department: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  role: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  salary: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active'
  },
  hire_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
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
  tableName: 'Employee',
  indexes: [
    {
      fields: ['enterprise_id']
    },
    {
      fields: ['department']
    },
    {
      fields: ['status']
    }
  ]
});