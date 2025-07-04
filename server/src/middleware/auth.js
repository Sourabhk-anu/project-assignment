import jwt from 'jsonwebtoken';
import { User, Role, RolePermission } from '../models/index.js';

export const authenticateJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findByPk(decoded.userId, {
      include: [
        {
          model: Role,
          as: 'role',
          include: [
            {
              model: RolePermission,
              as: 'permissions'
            }
          ]
        }
      ]
    });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (user.status === 'locked') {
      return res.status(423).json({ message: 'Account is locked' });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({ message: 'Account is inactive' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    return res.status(500).json({ message: 'Authentication error' });
  }
};

export const authorize = (module, action) => {
  return (req, res, next) => {
    try {
      const user = req.user;
      
      if (!user || !user.role) {
        return res.status(403).json({ message: 'Access denied: No role assigned' });
      }

      // Super admin has access to everything
      if (user.role.name === 'Super Admin') {
        return next();
      }

      const permissions = user.role.permissions || [];
      const modulePermission = permissions.find(p => p.module === module);

      if (!modulePermission) {
        return res.status(403).json({ message: `Access denied: No permissions for ${module} module` });
      }

      const permissionKey = `can_${action}`;
      if (!modulePermission[permissionKey]) {
        return res.status(403).json({ message: `Access denied: Cannot ${action} ${module}` });
      }

      next();
    } catch (error) {
      return res.status(500).json({ message: 'Authorization error' });
    }
  };
};

export const requireRole = (roleName) => {
  return (req, res, next) => {
    if (!req.user || req.user.role.name !== roleName) {
      return res.status(403).json({ message: 'Access denied: Insufficient privileges' });
    }
    next();
  };
};