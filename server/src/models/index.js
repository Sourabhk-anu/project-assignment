import { sequelize } from '../database/connection.js';
import { User } from './User.js';
import { Role } from './Role.js';
import { Enterprise } from './Enterprise.js';
import { Employee } from './Employee.js';
import { Product } from './Product.js';
import { RolePermission } from './RolePermission.js';

// Define associations
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
User.belongsTo(Enterprise, { foreignKey: 'enterprise_id', as: 'enterprise' });

Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });
Role.hasMany(RolePermission, { foreignKey: 'role_id', as: 'permissions' });

Enterprise.hasMany(User, { foreignKey: 'enterprise_id', as: 'users' });
Enterprise.hasMany(Employee, { foreignKey: 'enterprise_id', as: 'employees' });
Enterprise.hasMany(Product, { foreignKey: 'enterprise_id', as: 'products' });

Employee.belongsTo(Enterprise, { foreignKey: 'enterprise_id', as: 'enterprise' });
Product.belongsTo(Enterprise, { foreignKey: 'enterprise_id', as: 'enterprise' });

RolePermission.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });

export {
  sequelize,
  User,
  Role,
  Enterprise,
  Employee,
  Product,
  RolePermission
};