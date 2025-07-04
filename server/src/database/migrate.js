import { sequelize } from './connection.js';
import { 
  User, 
  Role, 
  Enterprise, 
  Employee, 
  Product, 
  RolePermission 
} from '../models/index.js';

async function runMigrations() {
  try {
    console.log('Starting database migration...');
    
    // Create tables in the correct order (respecting foreign key dependencies)
    await Role.sync({ force: true });
    await Enterprise.sync({ force: true });
    await User.sync({ force: true });
    await Employee.sync({ force: true });
    await Product.sync({ force: true });
    await RolePermission.sync({ force: true });


    console.log('✅ Database tables created successfully');
    
    // Create indexes for better performance
    await sequelize.query(`
      CREATE INDEX idx_users_email ON users(email);
      CREATE INDEX idx_users_username ON users(username);
      CREATE INDEX idx_users_role_id ON users(role_id);
      CREATE INDEX idx_users_enterprise_id ON users(enterprise_id);
      CREATE INDEX idx_employees_enterprise_id ON employees(enterprise_id);
      CREATE INDEX idx_employees_department ON employees(department);
      CREATE INDEX idx_products_enterprise_id ON products(enterprise_id);
      CREATE INDEX idx_products_category ON products(category);
      CREATE INDEX idx_products_sku ON products(sku);
      CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
      CREATE INDEX idx_role_permissions_module ON role_permissions(module);
    `);

    
    console.log('✅ Database indexes created successfully');
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

runMigrations()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));

export { runMigrations };