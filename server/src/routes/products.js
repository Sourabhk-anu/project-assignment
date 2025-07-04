import express from 'express';
import { Op } from 'sequelize';
import { Product, Enterprise } from '../models/index.js';
import { authenticateJWT, authorize } from '../middleware/auth.js';
import { validateProduct, validatePagination, validateId } from '../middleware/validation.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateJWT);

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products with pagination
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', [authorize('products', 'read'), validatePagination], async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const enterpriseId = req.query.enterprise_id;
    const category = req.query.category;
    const status = req.query.status;

    let whereClause = {};

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { sku: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { category: { [Op.like]: `%${search}%` } }
      ];
    }

    if (enterpriseId) {
      whereClause.enterprise_id = enterpriseId;
    }

    if (category) {
      whereClause.category = category;
    }

    if (status) {
      whereClause.status = status;
    }

    const { count, rows } = await Product.findAndCountAll({
      where: whereClause,
      include: [
        { model: Enterprise, as: 'enterprise', attributes: ['id', 'name'] }
      ],
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });

    res.json({
      products: rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/products/:id:
 *   get:
 *     summary: Get product by ID
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', [authorize('products', 'read'), validateId], async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [{ model: Enterprise, as: 'enterprise' }]
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create new product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', [authorize('products', 'create'), validateProduct], async (req, res) => {
  try {
    const product = await Product.create(req.body);
    
    const newProduct = await Product.findByPk(product.id, {
      include: [{ model: Enterprise, as: 'enterprise' }]
    });

    res.status(201).json({
      message: 'Product created successfully',
      product: newProduct
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/products/:id:
 *   put:
 *     summary: Update product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', [authorize('products', 'update'), validateId], async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await product.update(req.body);

    const updatedProduct = await Product.findByPk(product.id, {
      include: [{ model: Enterprise, as: 'enterprise' }]
    });

    res.json({
      message: 'Product updated successfully',
      product: updatedProduct
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/products/:id:
 *   delete:
 *     summary: Delete product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', [authorize('products', 'delete'), validateId], async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await product.destroy();
    
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;