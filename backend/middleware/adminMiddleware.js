const adminMiddleware = (req, res, next) => {
  if (!req.user || (req.user.role !== "admin" && req.user.role !== "staff")) {
    return res.status(403).json({ message: "Access forbidden" });
  }
  next();
};

module.exports = adminMiddleware;
