import express from 'express';
import { Op } from 'sequelize';
import { Employee, Enterprise } from '../models/index.js';
import { authenticateJWT, authorize } from '../middleware/auth.js';
import { validateEmployee, validatePagination, validateId } from '../middleware/validation.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateJWT);

/**
 * @swagger
 * /api/employees:
 *   get:
 *     summary: Get all employees with pagination
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', [authorize('employees', 'read'), validatePagination], async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const enterpriseId = req.query.enterprise_id;
    const department = req.query.department;
    const status = req.query.status;

    let whereClause = {};

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { department: { [Op.like]: `%${search}%` } },
        { role: { [Op.like]: `%${search}%` } }
      ];
    }

    if (enterpriseId) {
      whereClause.enterprise_id = enterpriseId;
    }

    if (department) {
      whereClause.department = department;
    }

    if (status) {
      whereClause.status = status;
    }

    const { count, rows } = await Employee.findAndCountAll({
      where: whereClause,
      include: [
        { model: Enterprise, as: 'enterprise', attributes: ['id', 'name'] }
      ],
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });

    res.json({
      employees: rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/employees/:id:
 *   get:
 *     summary: Get employee by ID
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', [authorize('employees', 'read'), validateId], async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id, {
      include: [{ model: Enterprise, as: 'enterprise' }]
    });

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json(employee);
  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/employees:
 *   post:
 *     summary: Create new employee
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', [authorize('employees', 'create'), validateEmployee], async (req, res) => {
  try {
    const employee = await Employee.create(req.body);
    
    const newEmployee = await Employee.findByPk(employee.id, {
      include: [{ model: Enterprise, as: 'enterprise' }]
    });

    res.status(201).json({
      message: 'Employee created successfully',
      employee: newEmployee
    });
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/employees/:id:
 *   put:
 *     summary: Update employee
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', [authorize('employees', 'update'), validateId], async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id);
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    await employee.update(req.body);

    const updatedEmployee = await Employee.findByPk(employee.id, {
      include: [{ model: Enterprise, as: 'enterprise' }]
    });

    res.json({
      message: 'Employee updated successfully',
      employee: updatedEmployee
    });
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/employees/:id:
 *   delete:
 *     summary: Delete employee
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', [authorize('employees', 'delete'), validateId], async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id);
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    await employee.destroy();
    
    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;