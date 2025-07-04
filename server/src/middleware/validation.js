import { body, param, query, validationResult } from 'express-validator';

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation error',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// User validation rules
export const validateUser = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .isAlphanumeric()
    .withMessage('Username must contain only letters and numbers'),
  body('email')
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, lowercase letter, number, and special character'),
  body('first_name')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name must contain only letters and spaces'),
  body('last_name')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name must contain only letters and spaces'),
  body('role_id')
    .isInt({ min: 1 })
    .withMessage('Role ID must be a positive integer'),
  body('enterprise_id')
    .isInt({ min: 1 })
    .withMessage('Enterprise ID must be a positive integer'),
  handleValidationErrors
];

// Role validation rules
export const validateRole = [
  body('name')
    .isLength({ min: 2, max: 50 })
    .withMessage('Role name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Role name must contain only letters and spaces'),
  body('description')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Description must not exceed 255 characters'),
  handleValidationErrors
];

// Enterprise validation rules
export const validateEnterprise = [
  body('name')
    .isLength({ min: 2, max: 100 })
    .withMessage('Enterprise name must be between 2 and 100 characters'),
  body('location')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Location must not exceed 255 characters'),
  body('contact_info')
    .optional()
    .isObject()
    .withMessage('Contact info must be a valid object'),
  handleValidationErrors
];

// Employee validation rules
export const validateEmployee = [
  body('name')
    .isLength({ min: 2, max: 100 })
    .withMessage('Employee name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Employee name must contain only letters and spaces'),
  body('email')
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail(),
  body('department')
    .isLength({ min: 2, max: 50 })
    .withMessage('Department must be between 2 and 50 characters'),
  body('role')
    .isLength({ min: 2, max: 50 })
    .withMessage('Role must be between 2 and 50 characters'),
  body('salary')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Salary must be a positive number'),
  body('enterprise_id')
    .isInt({ min: 1 })
    .withMessage('Enterprise ID must be a positive integer'),
  handleValidationErrors
];

// Product validation rules
export const validateProduct = [
  body('name')
    .isLength({ min: 2, max: 100 })
    .withMessage('Product name must be between 2 and 100 characters'),
  body('sku')
    .isLength({ min: 3, max: 50 })
    .withMessage('SKU must be between 3 and 50 characters')
    .matches(/^[A-Z0-9-]+$/)
    .withMessage('SKU must contain only uppercase letters, numbers, and hyphens'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('category')
    .isLength({ min: 2, max: 50 })
    .withMessage('Category must be between 2 and 50 characters'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('stock_quantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock quantity must be a non-negative integer'),
  body('enterprise_id')
    .isInt({ min: 1 })
    .withMessage('Enterprise ID must be a positive integer'),
  handleValidationErrors
];

// Pagination validation
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

// ID parameter validation
export const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID must be a positive integer'),
  handleValidationErrors
];