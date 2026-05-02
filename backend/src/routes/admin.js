const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth");
const roleGuard = require("../middleware/roleGuard");
const {
  getDashboard, getAnalytics, getTopRiders,
  getAllOrders, getAllUsers, getAllRiders,
  toggleBlockUser, toggleBlockRider, overrideOrderStatus,
  createRider, deleteRider, getLeaderboards
} = require("../controllers/adminController");

router.use(protect, roleGuard("admin"));

router.get("/dashboard",   getDashboard);
router.get("/analytics",   getAnalytics);
router.get("/leaderboards", getLeaderboards);
router.get("/top-riders",  getTopRiders);
router.get("/orders",      getAllOrders);
router.get("/users",       getAllUsers);
router.get("/riders",      getAllRiders);
router.post("/riders",     createRider);
router.delete("/riders/:id", deleteRider);
router.patch("/users/:id/block",    toggleBlockUser);
router.patch("/riders/:id/block",   toggleBlockRider);
router.patch("/orders/:id/status",  overrideOrderStatus);

module.exports = router;
