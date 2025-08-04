const express=require("express");
const {protect,adminOnly}=require("../middlewares/authMiddleware");
const {
    getDashboardData,
    getUserDashboardData,
    getTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    updateTaskChecklist,
    getTasksForSpecificUser, // Make sure to import it
    addRemarkToTask,
    startTimer,
    stopTimer,
    getActiveTimer, // Already there
    getTaskTimeLogs,
} = require("../controllers/taskController");
const router=express.Router();

router.get("/dashboard-data",protect,getDashboardData);
router.get("/user-dashboard-data",protect, getUserDashboardData);
router.get("/",protect,getTasks);
router.get("/user/:userId", protect, adminOnly, getTasksForSpecificUser); // Add this line
router.get("/:id",protect,getTaskById);
router.post("/",protect,adminOnly,createTask);
router.put("/:id",protect,adminOnly,updateTask);
router.delete("/:id",protect,adminOnly,deleteTask);
router.put("/:id/status",protect,updateTaskStatus);
router.put("/:id/todo",protect,updateTaskChecklist);
router.post("/:id/remarks", protect, adminOnly, addRemarkToTask);

router.post("/:taskId/timelogs/start", protect, startTimer); // Start timer (user or admin)
router.put("/:taskId/timelogs/:timeLogId/stop", protect, stopTimer); // Stop timer (owner or admin)
router.get("/:taskId/timelogs/active", protect, getActiveTimer); // For frontend to check active timer

// NEW ROUTE: Get all time logs for a task
router.get("/:taskId/timelogs", protect, getTaskTimeLogs); // <-- Add this route

module.exports=router;