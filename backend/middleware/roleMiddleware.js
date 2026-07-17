const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Access denied. Insufficient permissions.',
        requiredRoles: allowedRoles,
        userRole: req.user.role
      });
    }

    next();
  };
};

const isAdmin = roleMiddleware(['HR_ADMIN', 'SYS_ADMIN']);
const isSysAdmin = roleMiddleware(['SYS_ADMIN']);

module.exports = { roleMiddleware, isAdmin, isSysAdmin };
