import express from 'express';
import { Op } from 'sequelize';
import { User, Role, Enterprise, Employee, Product } from '../models/index.js';
import { authenticateJWT, authorize } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateJWT);

/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', [authorize('dashboard', 'read')], async (req, res) => {
  try {
    const currentUser = req.user;
    const timeRange = req.query.range || '30'; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeRange));

    // Base statistics available to all users
    const stats = {
      users: 0,
      enterprises: 0,
      employees: 0,
      products: 0,
      recentUsers: [],
      recentEmployees: [],
      recentProducts: [],
      userGrowth: [],
      employeesByDepartment: [],
      productsByCategory: []
    };

    // Get user count
    if (currentUser.role.name === 'Super Admin') {
      stats.users = await User.count();
    } else {
      stats.users = await User.count({
        where: { enterprise_id: currentUser.enterprise_id }
      });
    }

    // Get enterprise count (Super Admin only)
    if (currentUser.role.name === 'Super Admin') {
      stats.enterprises = await Enterprise.count();
    }

    // Get employee count
    const employeeWhere = currentUser.role.name === 'Super Admin' 
      ? {} 
      : { enterprise_id: currentUser.enterprise_id };
    
    stats.employees = await Employee.count({ where: employeeWhere });

    // Get product count
    const productWhere = currentUser.role.name === 'Super Admin' 
      ? {} 
      : { enterprise_id: currentUser.enterprise_id };
    
    stats.products = await Product.count({ where: productWhere });

    // Recent users (limited by enterprise for non-super admins)
    const userWhere = currentUser.role.name === 'Super Admin' 
      ? { created_at: { [Op.gte]: startDate } }
      : { 
          enterprise_id: currentUser.enterprise_id,
          created_at: { [Op.gte]: startDate }
        };

    stats.recentUsers = await User.findAll({
      where: userWhere,
      include: [
        { model: Role, as: 'role', attributes: ['name'] },
        { model: Enterprise, as: 'enterprise', attributes: ['name'] }
      ],
      order: [['created_at', 'DESC']],
      limit: 5,
      attributes: ['id', 'username', 'email', 'first_name', 'last_name', 'created_at']
    });

    // Recent employees
    stats.recentEmployees = await Employee.findAll({
      where: {
        ...employeeWhere,
        created_at: { [Op.gte]: startDate }
      },
      include: [
        { model: Enterprise, as: 'enterprise', attributes: ['name'] }
      ],
      order: [['created_at', 'DESC']],
      limit: 5
    });

    // Recent products
    stats.recentProducts = await Product.findAll({
      where: {
        ...productWhere,
        created_at: { [Op.gte]: startDate }
      },
      include: [
        { model: Enterprise, as: 'enterprise', attributes: ['name'] }
      ],
      order: [['created_at', 'DESC']],
      limit: 5
    });

    // User growth over time (last 30 days)
    const growthData = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));

      const count = await User.count({
        where: {
          ...userWhere,
          created_at: {
            [Op.between]: [startOfDay, endOfDay]
          }
        }
      });

      growthData.push({
        date: startOfDay.toISOString().split('T')[0],
        count
      });
    }
    stats.userGrowth = growthData;

    // Employees by department
    const departmentStats = await Employee.findAll({
      where: employeeWhere,
      attributes: [
        'department',
        [Employee.sequelize.fn('COUNT', Employee.sequelize.col('id')), 'count']
      ],
      group: ['department'],
      raw: true
    });
    stats.employeesByDepartment = departmentStats;

    // Products by category
    const categoryStats = await Product.findAll({
      where: productWhere,
      attributes: [
        'category',
        [Product.sequelize.fn('COUNT', Product.sequelize.col('id')), 'count']
      ],
      group: ['category'],
      raw: true
    });
    stats.productsByCategory = categoryStats;

    res.json(stats);
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;