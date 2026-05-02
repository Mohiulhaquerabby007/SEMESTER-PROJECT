const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Rider = require("../models/Rider");

const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    let account = await User.findById(decoded.id);
    let accountType = "user";

    if (!account) {
      account = await Rider.findById(decoded.id);
      accountType = "rider";
    }

    if (!account) {
      return res.status(401).json({ message: "Account not found" });
    }

    if (account.isBlocked) {
      return res.status(403).json({ message: "Account is blocked" });
    }

    req.user = account;
    req.accountType = accountType;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
};

module.exports = protect;
