import express from 'express';
import { Op } from 'sequelize';
import { Role, RolePermission, User } from '../models/index.js';
import { authenticateJWT, authorize } from '../middleware/auth.js';
import { validateRole, validatePagination, validateId } from '../middleware/validation.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateJWT);

/**
 * @swagger
 * /api/roles:
 *   get:
 *     summary: Get all roles with pagination
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', [authorize('roles', 'read'), validatePagination], async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    const whereClause = search ? {
      [Op.or]: [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ]
    } : {};

    const { count, rows } = await Role.findAndCountAll({
      where: whereClause,
      include: [
        { 
          model: RolePermission, 
          as: 'permissions' 
        },
        {
          model: User,
          as: 'users',
          attributes: ['id'],
          required: false
        }
      ],
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });

    const rolesWithCounts = rows.map(role => ({
      ...role.toJSON(),
      userCount: role.users ? role.users.length : 0
    }));

    res.json({
      roles: rolesWithCounts,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/roles/:id:
 *   get:
 *     summary: Get role by ID
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', [authorize('roles', 'read'), validateId], async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id, {
      include: [{ model: RolePermission, as: 'permissions' }]
    });

    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    res.json(role);
  } catch (error) {
    console.error('Get role error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/roles:
 *   post:
 *     summary: Create new role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', [authorize('roles', 'create'), validateRole], async (req, res) => {
  try {
    const { permissions, ...roleData } = req.body;
    
    const role = await Role.create(roleData);

    // Create permissions if provided
    if (permissions && Array.isArray(permissions)) {
      const permissionData = permissions.map(perm => ({
        ...perm,
        role_id: role.id
      }));
      await RolePermission.bulkCreate(permissionData);
    }

    const newRole = await Role.findByPk(role.id, {
      include: [{ model: RolePermission, as: 'permissions' }]
    });

    res.status(201).json({
      message: 'Role created successfully',
      role: newRole
    });
  } catch (error) {
    console.error('Create role error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/roles/:id:
 *   put:
 *     summary: Update role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', [authorize('roles', 'update'), validateId], async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id);
    
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    // Prevent updating system roles
    if (role.is_system_role) {
      return res.status(403).json({ message: 'Cannot modify system role' });
    }

    const { permissions, ...updateData } = req.body;
    
    await role.update(updateData);

    const updatedRole = await Role.findByPk(role.id, {
      include: [{ model: RolePermission, as: 'permissions' }]
    });

    res.json({
      message: 'Role updated successfully',
      role: updatedRole
    });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/roles/:id/permissions:
 *   put:
 *     summary: Update role permissions
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id/permissions', [authorize('roles', 'update'), validateId], async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id);
    
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    if (role.is_system_role) {
      return res.status(403).json({ message: 'Cannot modify system role permissions' });
    }

    const { permissions } = req.body;

    // Delete existing permissions
    await RolePermission.destroy({ where: { role_id: role.id } });

    // Create new permissions
    if (permissions && Array.isArray(permissions)) {
      const permissionData = permissions.map(perm => ({
        ...perm,
        role_id: role.id
      }));
      await RolePermission.bulkCreate(permissionData);
    }

    const updatedRole = await Role.findByPk(role.id, {
      include: [{ model: RolePermission, as: 'permissions' }]
    });

    res.json({
      message: 'Role permissions updated successfully',
      role: updatedRole
    });
  } catch (error) {
    console.error('Update role permissions error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/roles/:id:
 *   delete:
 *     summary: Delete role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', [authorize('roles', 'delete'), validateId], async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id, {
      include: [{ model: User, as: 'users' }]
    });
    
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    if (role.is_system_role) {
      return res.status(403).json({ message: 'Cannot delete system role' });
    }

    // Check if role is assigned to users
    if (role.users && role.users.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete role that is assigned to users' 
      });
    }

    await role.destroy();
    
    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;