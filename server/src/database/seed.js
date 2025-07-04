import bcrypt from 'bcryptjs';
import { 
  User, 
  Role, 
  Enterprise, 
  Employee, 
  Product, 
  RolePermission 
} from '../models/index.js';

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');

    // Create default enterprise
    const defaultEnterprise = await Enterprise.create({
      name: 'Default Enterprise',
      location: 'San Francisco, CA',
      contact_info: {
        email: 'admin@default-enterprise.com',
        phone: '+1 (555) 123-4567',
        website: 'https://default-enterprise.com'
      },
      status: 'active'
    });

    // Create additional sample enterprises
    const sampleEnterprise = await Enterprise.create({
      name: 'Tech Solutions Inc',
      location: 'New York, NY',
      contact_info: {
        email: 'contact@techsolutions.com',
        phone: '+1 (555) 987-6543',
        website: 'https://techsolutions.com'
      },
      status: 'active'
    });

    console.log('✅ Enterprises created');

    // Create roles
    const superAdminRole = await Role.create({
      name: 'Super Admin',
      description: 'Full system access with all permissions',
      is_system_role: true
    });

    const adminRole = await Role.create({
      name: 'Admin',
      description: 'Full access within enterprise scope',
      is_system_role: false
    });

    const managerRole = await Role.create({
      name: 'Manager',
      description: 'Manage employees and view reports',
      is_system_role: false
    });

    const userRole = await Role.create({
      name: 'User',
      description: 'Basic access to assigned modules',
      is_system_role: false
    });

    console.log('✅ Roles created');

    // Create role permissions
    const modules = ['dashboard', 'users', 'roles', 'enterprises', 'employees', 'products', 'reports'];
    
    // Super Admin - full permissions on all modules
    for (const module of modules) {
      await RolePermission.create({
        role_id: superAdminRole.id,
        module,
        can_create: true,
        can_read: true,
        can_update: true,
        can_delete: true
      });
    }

    // Admin - full permissions except system roles and enterprises
    for (const module of modules) {
      const canManageRoles = module !== 'roles';
      const canManageEnterprises = module !== 'enterprises';
      
      await RolePermission.create({
        role_id: adminRole.id,
        module,
        can_create: canManageRoles && canManageEnterprises,
        can_read: true,
        can_update: canManageRoles && canManageEnterprises,
        can_delete: canManageRoles && canManageEnterprises && module !== 'users'
      });
    }

    // Manager - read/write on employees and products, read on others
    const managerModules = ['dashboard', 'employees', 'products', 'reports'];
    for (const module of managerModules) {
      await RolePermission.create({
        role_id: managerRole.id,
        module,
        can_create: ['employees', 'products'].includes(module),
        can_read: true,
        can_update: ['employees', 'products'].includes(module),
        can_delete: false
      });
    }

    // User - read only on dashboard and assigned modules
    await RolePermission.create({
      role_id: userRole.id,
      module: 'dashboard',
      can_create: false,
      can_read: true,
      can_update: false,
      can_delete: false
    });

    console.log('✅ Role permissions created');

    // Create users
    const hashedPassword = await bcrypt.hash('admin123!', 12);
    
    const superAdmin = await User.create({
      username: 'superadmin',
      email: 'superadmin@system.com',
      password_hash: hashedPassword,
      first_name: 'Super',
      last_name: 'Administrator',
      status: 'active',
      role_id: superAdminRole.id,
      enterprise_id: defaultEnterprise.id
    });

    const admin = await User.create({
      username: 'admin',
      email: 'admin@default-enterprise.com',
      password_hash: hashedPassword,
      first_name: 'John',
      last_name: 'Admin',
      status: 'active',
      role_id: adminRole.id,
      enterprise_id: defaultEnterprise.id
    });

    const manager = await User.create({
      username: 'manager',
      email: 'manager@default-enterprise.com',
      password_hash: hashedPassword,
      first_name: 'Jane',
      last_name: 'Manager',
      status: 'active',
      role_id: managerRole.id,
      enterprise_id: defaultEnterprise.id
    });

    const regularUser = await User.create({
      username: 'user',
      email: 'user@default-enterprise.com',
      password_hash: hashedPassword,
      first_name: 'Bob',
      last_name: 'User',
      status: 'active',
      role_id: userRole.id,
      enterprise_id: defaultEnterprise.id
    });

    console.log('✅ Users created');

    // Create sample employees
    const employees = [
      {
        name: 'Alice Johnson',
        email: 'alice.johnson@default-enterprise.com',
        department: 'Engineering',
        role: 'Senior Developer',
        salary: 95000,
        status: 'active',
        enterprise_id: defaultEnterprise.id
      },
      {
        name: 'Bob Smith',
        email: 'bob.smith@default-enterprise.com',
        department: 'Marketing',
        role: 'Marketing Specialist',
        salary: 65000,
        status: 'active',
        enterprise_id: defaultEnterprise.id
      },
      {
        name: 'Carol Davis',
        email: 'carol.davis@default-enterprise.com',
        department: 'Sales',
        role: 'Sales Representative',
        salary: 55000,
        status: 'active',
        enterprise_id: defaultEnterprise.id
      },
      {
        name: 'David Wilson',
        email: 'david.wilson@techsolutions.com',
        department: 'Engineering',
        role: 'Lead Developer',
        salary: 110000,
        status: 'active',
        enterprise_id: sampleEnterprise.id
      },
      {
        name: 'Eva Brown',
        email: 'eva.brown@techsolutions.com',
        department: 'HR',
        role: 'HR Manager',
        salary: 75000,
        status: 'active',
        enterprise_id: sampleEnterprise.id
      }
    ];

    await Employee.bulkCreate(employees);
    console.log('✅ Sample employees created');

    // Create sample products
    const products = [
      {
        name: 'Premium Software License',
        sku: 'SW-PREM-001',
        price: 299.99,
        category: 'Software',
        description: 'Premium software license with full features',
        status: 'active',
        stock_quantity: 100,
        enterprise_id: defaultEnterprise.id
      },
      {
        name: 'Basic Subscription',
        sku: 'SUB-BASIC-001',
        price: 29.99,
        category: 'Subscription',
        description: 'Basic monthly subscription plan',
        status: 'active',
        stock_quantity: 1000,
        enterprise_id: defaultEnterprise.id
      },
      {
        name: 'Enterprise Solution',
        sku: 'ENT-SOL-001',
        price: 1999.99,
        category: 'Enterprise',
        description: 'Complete enterprise solution package',
        status: 'active',
        stock_quantity: 50,
        enterprise_id: defaultEnterprise.id
      },
      {
        name: 'Tech Consulting Service',
        sku: 'SVC-TECH-001',
        price: 150.00,
        category: 'Service',
        description: 'Hourly technical consulting service',
        status: 'active',
        stock_quantity: 500,
        enterprise_id: sampleEnterprise.id
      },
      {
        name: 'Cloud Storage Pro',
        sku: 'CLD-STOR-PRO',
        price: 49.99,
        category: 'Cloud',
        description: 'Professional cloud storage solution',
        status: 'active',
        stock_quantity: 200,
        enterprise_id: sampleEnterprise.id
      }
    ];

    await Product.bulkCreate(products);
    console.log('✅ Sample products created');

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📋 Default Accounts Created:');
    console.log('Super Admin: superadmin@system.com / admin123!');
    console.log('Admin: admin@default-enterprise.com / admin123!');
    console.log('Manager: manager@default-enterprise.com / admin123!');
    console.log('User: user@default-enterprise.com / admin123!');

  } catch (error) {
    console.error('Seeding failed:', error);
    throw error;
  }
}

// Run seeding if this file is executed directly
seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));

export { seedDatabase };