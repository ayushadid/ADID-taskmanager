const Project = require("../models/Project");

/**
 * @desc    Create a new project
 * @route   POST /api/projects
 * @access  Private (Admin)
 */
const createProject = async (req, res) => {
  try {
    const { name, description, members } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Project name is required" });
    }

    const project = await Project.create({
      name,
      description,
      members,
      owner: req.user.id, // Set the logged-in user as the owner
    });

    res.status(201).json(project);
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

/**
 * @desc    Get all projects for the logged-in user
 * @route   GET /api/projects
 * @access  Private
 */
const getProjects = async (req, res) => {
  try {
    // Find all projects where the logged-in user is either the owner or a member
    // const projects = await Project.find({
    //   $or: [{ owner: req.user.id }, { members: req.user.id }],
    // }).populate("owner members", "name email"); // Populate user details
// Find all projects, no user filtering
const projects = await Project.find({}).populate("owner members", "name email"); // An empty filter {} fetches all documents
    res.status(200).json(projects);
  } catch (error) {
    console.error("Error getting projects:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

/**
 * @desc    Get ALL projects in the system
 * @route   GET /api/projects/all
 * @access  Private (Admin Only)
 */
const getAllProjects = async (req, res) => {
  try {
    // Find all projects without any user-based filtering
    const projects = await Project.find({}).sort({ name: 1 }); // Sort alphabetically by name
    res.status(200).json(projects);
  } catch (error) {
    console.error("Error getting all projects:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};


module.exports = {
  createProject,
  getProjects,
  getAllProjects, // 👈 Add the new function here
};

