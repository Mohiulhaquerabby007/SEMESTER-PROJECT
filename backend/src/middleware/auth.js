const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Rider = require("../models/Rider");

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    let account;
    let accountType;

    if (decoded.role === "rider") {
      account = await Rider.findById(decoded.id);
      accountType = "rider";
    } else {
      account = await User.findById(decoded.id);
      accountType = decoded.role || "user";
    }

    if (!account) return res.status(401).json({ message: "Not authorized" });
    if (account.isBlocked) return res.status(403).json({ message: "Account blocked" });

    req.user = account;
    req.accountType = accountType;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Not authorized" });
  }
};

module.exports = protect;
