import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { body } from 'express-validator';
import { User, Role, Enterprise } from '../models/index.js';
import { handleValidationErrors } from '../middleware/validation.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 */
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      where: { email },
      include: [
        { model: Role, as: 'role' },
        { model: Enterprise, as: 'enterprise' }
      ]
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if account is locked
    if (user.locked_until && user.locked_until > new Date()) {
      return res.status(423).json({ message: 'Account is temporarily locked' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      // Increment login attempts
      const loginAttempts = user.login_attempts + 1;
      const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;
      
      const updateData = { login_attempts: loginAttempts };
      
      if (loginAttempts >= maxAttempts) {
        const lockoutTime = parseInt(process.env.LOCKOUT_TIME) || 900000; // 15 minutes
        updateData.locked_until = new Date(Date.now() + lockoutTime);
      }
      
      await user.update(updateData);
      
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Reset login attempts on successful login
    await user.update({
      login_attempts: 0,
      locked_until: null,
      last_login: new Date()
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        enterprise: user.enterprise
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 */
router.get('/me', authenticateJWT, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [
        { model: Role, as: 'role' },
        { model: Enterprise, as: 'enterprise' }
      ]
    });

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      enterprise: user.enterprise
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Authentication]
 */
router.post('/reset-password', [
  body('email').isEmail().normalizeEmail(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      // Don't reveal if email exists for security
      return res.json({ message: 'If the email exists, a reset link has been sent' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    await user.update({
      reset_password_token: resetToken,
      reset_password_expires: resetExpires
    });

    // In production, send email with reset link
    // For demo purposes, we'll just return the token
    res.json({ 
      message: 'Password reset token generated',
      resetToken: resetToken // Remove this in production
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/auth/reset-password/:token:
 *   post:
 *     summary: Reset password with token
 *     tags: [Authentication]
 */
router.post('/reset-password/:token', [
  body('password').isLength({ min: 8 }),
  handleValidationErrors
], async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      where: {
        reset_password_token: token,
        reset_password_expires: { [Op.gt]: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 12);

    await user.update({
      password_hash: hashedPassword,
      reset_password_token: null,
      reset_password_expires: null,
      login_attempts: 0,
      locked_until: null
    });

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password confirm error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;