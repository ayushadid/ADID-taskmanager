const TimeLog = require("../models/TimeLog");

/**
 * @desc    Get all time logs for a user on a specific day
 * @route   GET /api/timelogs/day/:userId
 * @access  Private
 */
const getTimeLogsByDay = async (req, res) => {
  try {
    const { date } = req.query;
    const { userId } = req.params;

    // Authorization: An admin can see anyone's logs. A user can only see their own.
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({ message: "Not authorized to view these time logs." });
    }
    
    if (!date) {
      return res.status(400).json({ message: "A date is required." });
    }

    // Create start and end of day using native Date
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const timeLogs = await TimeLog.find({
      user: userId,
      startTime: { $gte: startOfDay, $lte: endOfDay },
      endTime: { $ne: null }, // Only get completed time logs
    }).populate("task", "title");

    res.status(200).json(timeLogs);
  } catch (error) {
    console.error("Error fetching time logs by day:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
// In backend/controllers/timelogController.js

// ... your existing getTimeLogsByDay function is here ...

/**
 * @desc    Get ALL time logs for ALL users on a specific day
 * @route   GET /api/timelogs/all-by-day
 * @access  Private (Admin Only)
 */
const getAllTimeLogsByDay = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: "A date is required." });
    }

    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const timeLogs = await TimeLog.find({
      startTime: { $gte: startOfDay, $lte: endOfDay },
      endTime: { $ne: null },
    })
    .sort({ user: 1, startTime: 1 }) // Sort by user, then by start time
    .populate("task", "title")
    .populate("user", "name"); // Also populate the user's name

    res.status(200).json(timeLogs);
  } catch (error) {
    console.error("Error fetching all time logs by day:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};


/**
 * @desc    Get all currently active time logs
 * @route   GET /api/timelogs/active
 * @access  Private (Admin Only)
 */
const getActiveTimelogs = async (req, res) => {
  try {
    const activeLogs = await TimeLog.find({ endTime: null })
      .populate({
          path: 'task',
          // 👇 This is the updated part 👇
          populate: [
             { path: 'project', select: 'name' },
             { path: 'assignedTo', select: 'name email profileImageUrl' } // This was missing
          ]
       })
      .populate("user", "name"); // This populates the user who is actively working

    res.status(200).json(activeLogs);
  } catch (error) {
    console.error("Error fetching active time logs:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};


module.exports = {
  getTimeLogsByDay,
  getAllTimeLogsByDay,
  getActiveTimelogs, // 👈 Add the new function to exports
};
