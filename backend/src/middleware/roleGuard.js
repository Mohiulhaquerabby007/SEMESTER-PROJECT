const roleGuard = (requiredRole) => {
  return (req, res, next) => {
    const role = req.user?.role || req.accountType;
    if (role !== requiredRole) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
};

module.exports = roleGuard;
