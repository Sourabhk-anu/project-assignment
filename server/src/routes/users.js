import express from 'express';
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import { User, Role, Enterprise } from '../models/index.js';
import { authenticateJWT, authorize } from '../middleware/auth.js';
import { validateUser, validatePagination, validateId } from '../middleware/validation.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateJWT);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users with pagination
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', [authorize('users', 'read'), validatePagination], async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    const whereClause = search ? {
      [Op.or]: [
        { username: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { first_name: { [Op.like]: `%${search}%` } },
        { last_name: { [Op.like]: `%${search}%` } }
      ]
    } : {};

    const { count, rows } = await User.findAndCountAll({
      where: whereClause,
      include: [
        { model: Role, as: 'role' },
        { model: Enterprise, as: 'enterprise' }
      ],
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });

    res.json({
      users: rows.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        status: user.status,
        last_login: user.last_login,
        role: user.role,
        enterprise: user.enterprise,
        created_at: user.created_at
      })),
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/users/:id:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', [authorize('users', 'read'), validateId], async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      include: [
        { model: Role, as: 'role' },
        { model: Enterprise, as: 'enterprise' }
      ]
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      status: user.status,
      last_login: user.last_login,
      role: user.role,
      enterprise: user.enterprise,
      created_at: user.created_at
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create new user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', [authorize('users', 'create'), validateUser], async (req, res) => {
  try {
    const { password, ...userData } = req.body;
    
    const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 12);
    
    const user = await User.create({
      ...userData,
      password_hash: hashedPassword
    });

    const newUser = await User.findByPk(user.id, {
      include: [
        { model: Role, as: 'role' },
        { model: Enterprise, as: 'enterprise' }
      ]
    });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        status: newUser.status,
        role: newUser.role,
        enterprise: newUser.enterprise
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/users/:id:
 *   put:
 *     summary: Update user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', [authorize('users', 'update'), validateId], async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { password, ...updateData } = req.body;
    
    if (password) {
      updateData.password_hash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 12);
    }

    await user.update(updateData);

    const updatedUser = await User.findByPk(user.id, {
      include: [
        { model: Role, as: 'role' },
        { model: Enterprise, as: 'enterprise' }
      ]
    });

    res.json({
      message: 'User updated successfully',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        status: updatedUser.status,
        role: updatedUser.role,
        enterprise: updatedUser.enterprise
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/users/:id:
 *   delete:
 *     summary: Delete user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', [authorize('users', 'delete'), validateId], async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting system admin
    if (user.id === 1) {
      return res.status(403).json({ message: 'Cannot delete system administrator' });
    }

    await user.destroy();
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;