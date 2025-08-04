const express = require("express");
const router = express.Router();
const { getTimeLogsByDay } = require("../controllers/timelogController");
const { protect } = require("../middlewares/authMiddleware");

// Route now includes :userId
router.get("/day/:userId", protect, getTimeLogsByDay);

module.exports = router;