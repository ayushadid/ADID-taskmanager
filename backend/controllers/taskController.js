const Task=require("../models/Task");
const TimeLog=require("../models/TimeLog");

// @desc Get active timer for a specific task and user
// @route GET /api/tasks/:taskId/timelogs/active
// @access Private (Assigned User or Admin)
// @desc Get active timer for a specific task and user
// @route GET /api/tasks/:taskId/timelogs/active
// @access Private (Assigned User or Admin)
const getActiveTimer = async (req, res) => {
    try {
        const { taskId } = req.params;
        const userId = req.user._id;

        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ message: "Task not found." });
        }

        // Authorization: Only assigned users or admins can check active timers for this task
        const isAssigned = task.assignedTo.some(
            (id) => id.toString() === userId.toString()
        );
        const isAdmin = req.user.role === "admin";

        if (!isAssigned && !isAdmin) {
            return res.status(403).json({ message: "Not authorized to view timer for this task." });
        }

        // Find an active time log for this user on this task
        const activeTimeLog = await TimeLog.findOne({
            task: taskId,
            user: userId,
            endTime: null, // Look for logs where endTime is not set
        }).populate('user', 'name profileImageUrl'); // Optionally populate user info for display

        res.status(200).json({ activeTimeLog });

    } catch (error) {
        console.error("Error getting active timer:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// @desc Get all time logs for a specific task
// @route GET /api/tasks/:taskId/timelogs
// @access Private (Assigned User or Admin to view)
const getTaskTimeLogs = async (req, res) => {
    try {
        const { taskId } = req.params;
        const userId = req.user._id;

        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ message: "Task not found." });
        }


        // Find all time logs for this task, sorted by startTime (latest first)
        const timeLogs = await TimeLog.find({ task: taskId })
            .populate('user', 'name profileImageUrl') // Populate user who logged time
            .sort({ startTime: -1 }); // Sort by newest first

        // Calculate total duration
        const totalDurationMs = timeLogs.reduce((sum, log) => sum + (log.duration || 0), 0);

        res.status(200).json({
            timeLogs,
            totalDurationMs,
        });

    } catch (error) {
        console.error("Error getting task time logs:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// @desc Start a timer for a task
// @route POST /api/tasks/:taskId/timelogs/start
// @access Private (Assigned User or Admin)
const startTimer = async (req, res) => {
    try {
        const { taskId } = req.params;
        const userId = req.user._id; // User ID from the authenticated token

        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ message: "Task not found." });
        }

        // Authorization: Only assigned users or admins can start a timer for this task
        const isAssigned = task.assignedTo.some(
            (id) => id.toString() === userId.toString()
        );
        const isAdmin = req.user.role === "admin";

        if (!isAssigned && !isAdmin) {
            return res.status(403).json({ message: "Not authorized to start a timer for this task." });
        }

        // Check if there's an existing active timer for this user on this task
        const activeTimeLog = await TimeLog.findOne({
            task: taskId,
            user: userId,
            endTime: null, // Look for logs where endTime is not set
        });

        if (activeTimeLog) {
            return res.status(400).json({ message: "You already have an active timer for this task. Please stop it first." });
        }

        // Create a new TimeLog entry
        const newTimeLog = await TimeLog.create({
            task: taskId,
            user: userId,
            startTime: Date.now(), // Set current time
        });

        res.status(201).json({
            message: "Timer started successfully.",
            timeLog: newTimeLog,
        });

    } catch (error) {
        console.error("Error starting timer:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// @desc Stop a timer for a task
// @route PUT /api/tasks/:taskId/timelogs/:timeLogId/stop
// @access Private (User who started it or Admin)
const stopTimer = async (req, res) => {
    try {
        const { taskId, timeLogId } = req.params;
        const userId = req.user._id;

        // Find the specific time log entry
        const timeLog = await TimeLog.findById(timeLogId);

        if (!timeLog) {
            return res.status(404).json({ message: "Time log entry not found." });
        }

        // Ensure the time log belongs to the correct task
        if (timeLog.task.toString() !== taskId) {
            return res.status(400).json({ message: "Time log does not belong to the specified task." });
        }

        // Authorization: Only the user who started the timer or an admin can stop it
        const isOwner = timeLog.user.toString() === userId.toString();
        const isAdmin = req.user.role === "admin";

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: "Not authorized to stop this timer." });
        }

        // Check if the timer is already stopped
        if (timeLog.endTime !== null) {
            return res.status(400).json({ message: "Timer is already stopped." });
        }

        // Set endTime and calculate duration
        timeLog.endTime = Date.now();
        timeLog.duration = timeLog.endTime.getTime() - timeLog.startTime.getTime(); // Duration in milliseconds

        await timeLog.save();

        res.status(200).json({
            message: "Timer stopped successfully.",
            timeLog: timeLog,
        });

    } catch (error) {
        console.error("Error stopping timer:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};


//@desc Get all tasks (Admin:ALL Users: assigned to them)
//@route GET /api/tasks/
//@access Private
const getTasks = async (req, res) => {
    try {
        const { status } = req.query;
        let filter = {};
        if (status) {
            filter.status = status;
        }

        let tasks;
        const isUserAdmin = req.user.role === "admin";

        // Define population options
        const populateOptions = [
            { path: "assignedTo", select: "name email profileImageUrl" },
        ];

        // Conditionally add remarks population if the user is an admin
        if (isUserAdmin) {
            populateOptions.push({ path: "remarks.madeBy", select: "name email profileImageUrl" });
        }

        // --- MODIFICATION: Add .sort({ createdAt: -1 }) to both queries ---
        if (isUserAdmin) { // Admin fetches all tasks
            tasks = await Task.find(filter)
                              .populate(populateOptions)
                              .sort({ createdAt: -1 }); // Sort by creation date, newest first
        } else { // Non-admin (member) fetches only tasks assigned to them
            tasks = await Task.find({ ...filter, assignedTo: req.user._id })
                              .populate(populateOptions)
                              .sort({ createdAt: -1 }); // Sort by creation date, newest first
        }
        // --- END MODIFICATION ---

        // Add completed todoChecklist count to each task and conditionally remove remarks for non-admins
        tasks = await Promise.all(
            tasks.map(async (task) => {
                const completedCount = task.todoChecklist.filter(
                    (item) => item.completed
                ).length;

                // Create a mutable copy of the task document
                const taskObject = task.toObject(); // Use .toObject() for Mongoose documents

                // Correcting the typo `compltedTodoCount` to `completedTodoCount`
                taskObject.completedTodoCount = completedCount;
                // If you had a line like `delete taskObject.compltedTodoCount;` previously, you can remove it.

                // If the user is NOT an admin, delete the remarks field
                if (!isUserAdmin) {
                    delete taskObject.remarks;
                }
                return taskObject;
            })
        );

        // Status Summary Counts (already correctly handles admin/non-admin logic)
        const allTasks = await Task.countDocuments(
            isUserAdmin ? {} : { assignedTo: req.user._id }
        );
        const pendingTasks = await Task.countDocuments({
            ...filter,
            status: "Pending",
            ...(isUserAdmin ? {} : { assignedTo: req.user._id }), // Conditionally apply assignedTo filter
        });

        const inProgressTasks = await Task.countDocuments({
            ...filter,
            status: "In Progress",
            ...(isUserAdmin ? {} : { assignedTo: req.user._id }),
        });

        const completedTasks = await Task.countDocuments({
            ...filter,
            status: "Completed",
            ...(isUserAdmin ? {} : { assignedTo: req.user._id }),
        });

        res.json({
            tasks,
            statusSummary: {
                all: allTasks,
                pendingTasks,
                inProgressTasks,
                completedTasks,
            },
        });
    } catch (error) {
        console.error("Error in getTasks:", error);
        res.status(500).json({ message: "Server Error ", error: error.message });
    }
};
// Add this new function to your module.exports
// @desc Get tasks for a specific user (Admin only)
// @route GET /api/tasks/user/:userId
// @access Private (Admin)
const getTasksForSpecificUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { status } = req.query;

        let filter = { assignedTo: userId };
        if (status) {
            filter.status = status;
        }

        const populateOptions = [
            { path: "assignedTo", select: "name email profileImageUrl" },
            { path: "remarks.madeBy", select: "name email profileImageUrl" }
        ];

        const tasks = await Task.find(filter).populate(populateOptions);

        // --- START CORRECTION FOR PROGRESS / POPULATED DATA ---
        const tasksWithCalculatedFields = await Promise.all(
            tasks.map(async (task) => {
                // Convert the Mongoose document to a plain JavaScript object first.
                // This ensures all populated fields and the 'progress' field are accessible.
                const taskObject = task.toObject(); // Use .toObject() or .toJSON()

                const completedCount = taskObject.todoChecklist.filter( // Use taskObject here
                    (item) => item.completed
                ).length;

                // Make sure `completedTodoCount` is consistent (fix typo here if desired)
                taskObject.completedTodoCount = completedCount; // Changed to correct spelling
                delete taskObject.compltedTodoCount; // Remove the old typo if it exists

                return taskObject;
            })
        );
        // --- END CORRECTION ---

        res.json({ tasks: tasksWithCalculatedFields }); // Use the new array name

    } catch (error) {
        console.error("Error in getTasksForSpecificUser:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// @desc Add a remark to a task
// @route POST /api/tasks/:id/remarks
// @access Private (Admin Only)
const addRemarkToTask = async (req, res) => {
    try {
        const { text } = req.body;
        const taskId = req.params.id;

        // Basic validation
        if (!text) {
            return res.status(400).json({ message: "Remark text is required." });
        }

        // Find the task
        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ message: "Task not found." });
        }

        // Authorization: Only admins can add remarks
        // The 'adminOnly' middleware will handle this, but an explicit check here is also good practice
        // if this function might be called without the middleware in other contexts.
        // For now, we'll rely on the middleware for the route.

        // Create the new remark object
        const newRemark = {
            text,
            madeBy: req.user._id, // The ID of the logged-in user (from 'protect' middleware)
            createdAt: new Date(), // Explicitly set creation time for the remark
        };

        task.remarks.push(newRemark); // Add the new remark to the array

        await task.save(); // Save the updated task document

        // Fetch the updated task and populate necessary fields for the response
        const updatedTask = await Task.findById(taskId).populate([
            { path: "assignedTo", select: "name email profileImageUrl" },
            { path: "remarks.madeBy", select: "name email profileImageUrl" } // Populate the user who made the remark
        ]);

        res.status(201).json({ message: "Remark added successfully", task: updatedTask });

    } catch (error) {
        console.error("Error adding remark to task:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};


//@desc Get task by Id
//@route GET api/tasks/:id
//@access Private
// In your taskController.js file

const getTaskById = async (req, res) => {
    try {
        // The check for admin role is no longer needed to hide/show remarks
        // const isUserAdmin = req.user.role === "admin"; 

        // Always populate the remarks for any user viewing the task
        const populateOptions = [
            { path: "assignedTo", select: "name email profileImageUrl" },
            { path: "remarks.madeBy", select: "name email profileImageUrl" } // This is now always included
        ];

        /* // REMOVED: Conditional population
        if (isUserAdmin) {
            populateOptions.push({ path: "remarks.madeBy", select: "name email profileImageUrl" });
        }
        */

        const task = await Task.findById(req.params.id).populate(populateOptions);

        if (!task) {
            return res.status(404).json({ message: "Task not Found" });
        }

        const taskObject = task.toObject();

        /*
        // REMOVED: This block deleted remarks for non-admins
        if (!isUserAdmin) {
            delete taskObject.remarks;
        }
        */

        // Now, the full task object with remarks is sent to any user
        res.json(taskObject); 

    } catch (error) {
        console.error("Error in getTaskById:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};


//@desc Create a new task (admin only)
//@route POST /api/tasks/
//@access Private(admin)

const createTask=async(req,res)=>{
try{
    const{
        title,
        description,
        priority,
        dueDate,
        assignedTo,
        attachments,
        todoChecklist,
    }=req.body;

    if(!Array.isArray(assignedTo)){
        return res
            .status(400)
            .json({message:"AssignedTo must be an array of userIds"})
    }

    const task=await Task.create({
        title,
        description,
        priority,
        dueDate,
        assignedTo,
        createdBy:req.user._id,
        todoChecklist,
        attachments,
    });

    res.status(201).json({message:"Task Created Successfully",task})

    }catch(error){
        res.status(500).json({message:"Server Error ",error:error.message});
    }
};

//@desc Update Task Details
//@route PUT /api/tasks/:id
//@access PRIVATE
const updateTask=async(req,res)=>{
try{
    const task= await Task.findById(req.params.id);

    if(!task) return res.status(404).json({message:"Task not found"});

    task.title=req.body.title||task.title;
    task.description=req.body.description||task.description;
    task.priority=req.body.priority||task.priority;
    task.dueDate=req.body.dueDate||task.dueDate;
    task.todoChecklist=req.body.todoChecklist||task.todoChecklist;
    task.attachments=req.body.attachments||task.attachments;

    if(req.body.assignedTo){
        if(!Array.isArray(req.body.assignedTo)){
            return res
                .status(400)
                .json({message:"assignedTo must be an array"});
        }
        task.assignedTo=req.body.assignedTo;
    }

    const updatedTask=await task.save();
    res.json({message:"Task updated successfully", updatedTask});
    }catch(error){
        res.status(500).json({message:"Server Error ",error:error.message});
    }
};

//@desc delete a task (admin only)
//@route DELETE /api/tasks/:id
//@access PRIVATE (admin)

const deleteTask=async(req,res)=>{
try{
    const task=await Task.findById(req.params.id);
    if(!task) return res.status(404).json({message:"Task not found"});

    await task.deleteOne();
    res.json({message:"Task deleted Successfully"});
    }catch(error){
        res.status(500).json({message:"Server Error ",error:error.message});
    }
}

//@desc Update task status 
//@route PUT /api/tasks/:id/status
//@access PRIVATE 
const updateTaskStatus=async(req,res)=>{
try{
    const task=await Task.findById(req.params.id);
    if(!task) return res.status(404).json({message:"Task not found"});

    const isAssigned=task.assignedTo.some(
        (userId)=>userId.toString()===req.user._id.toString()
    );

    if(!isAssigned && req.user.role !=="admin"){
        return res.status(403).json({message:"Not authorized"});
    }

    task.status =req.body.status||task.status;

    if(task.status==="Completed"){
        task.todoChecklist.forEach((item)=>(item.completed=true));
        task.progress=100;
    }
    await task.save();
    res.json({message:"Task status updated",task})

    }catch(error){
        res.status(500).json({message:"Server Error ",error:error.message});
    }
}

//@desc update task checklist
//@route PUT /api/tasks/:id/todo
//@access PRIVATE
const updateTaskChecklist = async (req, res) => {
  try {
    const { todoChecklist } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) return res.status(404).json({ message: "Task not Found" });

    // Authorization check (this is good)
    if (!task.assignedTo.includes(req.user._id) && req.user.role != "admin") {
      return res
        .status(403)
        .json({ message: "Not authorised to update the checklist" });
    }

    task.todoChecklist = todoChecklist;

    // Progress calculation
    const completedCount = task.todoChecklist.filter(
      (item) => item.completed
    ).length;
    const totalItems = task.todoChecklist.length;
    task.progress =
      totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

    // Status update logic
    if (task.progress === 100) {
      task.status = "Completed";
    } else if (task.progress > 0) {
      task.status = "In Progress";
    } else {
      task.status = "Pending";
    }

    await task.save();

    // ✅ THE CORRECTED PART
    // Find the task again and populate ALL necessary fields before responding.
    const updatedTask = await Task.findById(req.params.id).populate([
      { path: "assignedTo", select: "name email profileImageUrl" },
      { path: "remarks.madeBy", select: "name email profileImageUrl" }, // <-- Add this line
    ]);

    res.json({ message: "Task checklist updated", task: updatedTask });
    
  } catch (error) {
    res.status(500).json({ message: "Server Error ", error: error.message });
  }
};
//@desc Dashboard data (admin only)
//@route GET /api/tasks/dashbaord-data
//@access PRIVATE

const getDashboardData=async(req,res)=>{
    try{
        //Fetch Statistics
        const totalTasks=await Task.countDocuments();
        const pendingTasks=await Task.countDocuments({status:"Pending"});
        const completedTasks=await Task.countDocuments({status:"Completed"});
        const inProgressTasks=await Task.countDocuments({status:"In Progress"});
        const overdueTasks=await Task.countDocuments({
            status:{ $ne:"Completed" },
            dueDate:{ $lt:new Date() },
        });

        //Ensure all possible status are included
        const taskStatuses=["Pending","In Progress","Completed"];
        const taskDistributionRaw=await Task.aggregate([
            {
            $group:{
                _id:"$status",
                count:{$sum:1},
                },
            },
        ]);

        const taskDistribution=taskStatuses.reduce((acc,status)=>{
            const formattedKey=status.replace(/\s+/g,""); //Remove spaces for response keys
            acc[formattedKey]=
                taskDistributionRaw.find((item)=>item._id===status)?.count || 0;
            return acc;
        },{});

        taskDistribution["All"]=totalTasks;  //Add total count to taskDistribution

        //Ensure all priority levels are included
        const taskPriorities=["Low","Medium","High"];
        const taskPriorityLevelsRaw=await Task.aggregate([
            {
                $group:{
                    _id:"$priority",
                    count:{$sum: 1},
                },
            },
        ]);
        const taskPriorityLevels=taskPriorities.reduce((acc,priority)=>{
            acc[priority]=
                taskPriorityLevelsRaw.find((item)=>item._id===priority)?.count||0;
            return acc;
        },{});

        //Fetch recent 10 tasks
        const recentTasks=await Task.find()
            .sort({createdAt:-1})
            .limit(10)
            .select("title status priority dueDate createdAt");

        res.status(200).json({
            statistics:{
                totalTasks,
                pendingTasks,
                completedTasks,
                overdueTasks,
            },
            charts:{
                taskDistribution,
                taskPriorityLevels,
            },
            recentTasks,
        });
} catch(error){
    res.status(500).json({message:"Server error", error:error.message});
}
};
//@desc Dashboard data (UserSpecific)
//@route GET /api/tasks/user-dashbaord-data
//@access PRIVATE
const getUserDashboardData=async(req,res)=>{
try{
    const userId=req.user._id; //only fetch data for logged in user

    //Fetch satistics for user specific tasks
    const totalTasks=await Task.countDocuments({assignedTo:userId});
    const pendingTasks=await Task.countDocuments({assignedTo:userId,status:"Pending"});
    const completedTasks=await Task.countDocuments({assignedTo:userId,status:"Completed"});
    const overdueTasks=await Task.countDocuments({
        assignedTo:userId,
        status:{$ne:"Completed"},
        dueDate:{$lt:new Date()},
    });

    //Task Distribution by Status 
    const taskStatuses=["Pending","In Progress","Completed"];
    const taskDistributionRaw=await Task.aggregate([
        {$match:{assignedTo:userId}},
        {$group:{_id:"$status",count:{$sum:1}}},
    ]);

    const taskDistribution=taskStatuses.reduce((acc,status)=>{
        const formattedKey=status.replace(/\s+/g,"");
        acc[formattedKey]=
            taskDistributionRaw.find((item)=>item._id===status)?.count||0;
        return acc;
    },{});
    taskDistribution["All"]=totalTasks;

    //Task Distribution by Priority
    const taskPriorities=["Low","Medium","High"];
    const taskPriorityLevelsRaw=await Task.aggregate([
        {$match:{assignedTo:userId}},
        {$group:{_id:"$priority",count:{$sum:1}}},
    ]);

    const taskPriorityLevels=taskPriorities.reduce((acc,priority)=>{
        acc[priority]=
            taskPriorityLevelsRaw.find((item)=>item._id===priority)?.count||0;
        return acc;
    },{});

    //Fetch recent 10 tasks
    const recentTasks=await Task.find({assignedTo:userId})
        .sort({createdAt:-1})
        .limit(10)
        .select("title status priority dueDate createdAt");

    res.status(200).json({
        statistics:{
            totalTasks,
            pendingTasks,
            completedTasks,
            overdueTasks,
        },
        charts:{
            taskDistribution,
            taskPriorityLevels,
        },
        recentTasks,
    });
    }catch(error){
        res.status(500).json({message:"Server Error ",error:error.message});
    }
}

module.exports={
    getTasks,
    getTasksForSpecificUser,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    updateTaskChecklist,
    getDashboardData,
    getUserDashboardData,
    addRemarkToTask,
    startTimer,
    stopTimer,
    getActiveTimer,
    getTaskTimeLogs,
};