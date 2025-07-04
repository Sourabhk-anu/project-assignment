import express from 'express';
import { Op } from 'sequelize';
import { Enterprise, User, Employee, Product } from '../models/index.js';
import { authenticateJWT, authorize } from '../middleware/auth.js';
import { validateEnterprise, validatePagination, validateId } from '../middleware/validation.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateJWT);

/**
 * @swagger
 * /api/enterprises:
 *   get:
 *     summary: Get all enterprises with pagination
 *     tags: [Enterprises]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', [authorize('enterprises', 'read'), validatePagination], async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    const whereClause = search ? {
      [Op.or]: [
        { name: { [Op.like]: `%${search}%` } },
        { location: { [Op.like]: `%${search}%` } }
      ]
    } : {};

    const { count, rows } = await Enterprise.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'users',
          attributes: ['id'],
          required: false
        },
        {
          model: Employee,
          as: 'employees',
          attributes: ['id'],
          required: false
        },
        {
          model: Product,
          as: 'products',
          attributes: ['id'],
          required: false
        }
      ],
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });

    const enterprisesWithCounts = rows.map(enterprise => ({
      ...enterprise.toJSON(),
      userCount: enterprise.users ? enterprise.users.length : 0,
      employeeCount: enterprise.employees ? enterprise.employees.length : 0,
      productCount: enterprise.products ? enterprise.products.length : 0
    }));

    res.json({
      enterprises: enterprisesWithCounts,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get enterprises error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/enterprises/:id:
 *   get:
 *     summary: Get enterprise by ID
 *     tags: [Enterprises]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', [authorize('enterprises', 'read'), validateId], async (req, res) => {
  try {
    const enterprise = await Enterprise.findByPk(req.params.id, {
      include: [
        { model: User, as: 'users' },
        { model: Employee, as: 'employees' },
        { model: Product, as: 'products' }
      ]
    });

    if (!enterprise) {
      return res.status(404).json({ message: 'Enterprise not found' });
    }

    res.json(enterprise);
  } catch (error) {
    console.error('Get enterprise error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/enterprises:
 *   post:
 *     summary: Create new enterprise
 *     tags: [Enterprises]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', [authorize('enterprises', 'create'), validateEnterprise], async (req, res) => {
  try {
    const enterprise = await Enterprise.create(req.body);

    res.status(201).json({
      message: 'Enterprise created successfully',
      enterprise
    });
  } catch (error) {
    console.error('Create enterprise error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/enterprises/:id:
 *   put:
 *     summary: Update enterprise
 *     tags: [Enterprises]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', [authorize('enterprises', 'update'), validateId], async (req, res) => {
  try {
    const enterprise = await Enterprise.findByPk(req.params.id);
    
    if (!enterprise) {
      return res.status(404).json({ message: 'Enterprise not found' });
    }

    await enterprise.update(req.body);

    res.json({
      message: 'Enterprise updated successfully',
      enterprise
    });
  } catch (error) {
    console.error('Update enterprise error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/enterprises/:id:
 *   delete:
 *     summary: Delete enterprise
 *     tags: [Enterprises]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', [authorize('enterprises', 'delete'), validateId], async (req, res) => {
  try {
    const enterprise = await Enterprise.findByPk(req.params.id, {
      include: [
        { model: User, as: 'users' },
        { model: Employee, as: 'employees' },
        { model: Product, as: 'products' }
      ]
    });
    
    if (!enterprise) {
      return res.status(404).json({ message: 'Enterprise not found' });
    }

    // Check if enterprise has associated records
    const hasUsers = enterprise.users && enterprise.users.length > 0;
    const hasEmployees = enterprise.employees && enterprise.employees.length > 0;
    const hasProducts = enterprise.products && enterprise.products.length > 0;

    if (hasUsers || hasEmployees || hasProducts) {
      return res.status(400).json({ 
        message: 'Cannot delete enterprise with associated users, employees, or products' 
      });
    }

    await enterprise.destroy();
    
    res.json({ message: 'Enterprise deleted successfully' });
  } catch (error) {
    console.error('Delete enterprise error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;