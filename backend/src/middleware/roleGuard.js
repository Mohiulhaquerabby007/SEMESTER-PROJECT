const roleGuard = (...allowedTypes) => {
  return (req, res, next) => {
    if (!allowedTypes.includes(req.accountType) && !allowedTypes.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
};

module.exports = roleGuard;
