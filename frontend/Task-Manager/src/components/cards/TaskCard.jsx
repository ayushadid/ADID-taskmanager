import React, { useState, useEffect, useRef, useContext } from 'react';
import Progress from '../Progress';
import { LuPaperclip } from 'react-icons/lu';
import moment from 'moment';
import { FaPlayCircle, FaPauseCircle, FaRegClock } from 'react-icons/fa'; // Play/Pause icons
import axiosInstance from '../../utils/axiosinstance';
import { API_PATHS } from '../../utils/apiPaths';
import toast from 'react-hot-toast';
import { UserContext } from '../../context/userContext'; // Import UserContext
import { useNavigate } from 'react-router-dom';

const TaskCard = ({
  task, // Pass the entire task object
  onClick, // For general card click action (like opening task details)
}) => {
  // Defensive check for 'task' prop
  if (!task) {
    console.error("TaskCard received an undefined 'task' prop.");
    return null; // Or render a placeholder/error message
  }

  const {
    _id: taskId, // Rename _id to taskId for clarity
    title,
    description,
    priority,
    status,
    progress,
    createdAt,
    dueDate,
    assignedTo, // Already populated with user objects from backend
    attachments,
    completedTodoCount,
    todoChecklist,
  } = task;

  const { user: currentUser } = useContext(UserContext); // Get the logged-in user from context

  const [isTimerActive, setIsTimerActive] = useState(false);
  const [activeTimeLogId, setActiveTimeLogId] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0); // In milliseconds
  const timerIntervalRef = useRef(null);

  // Helper to format duration for display (HH:MM:SS)
  const formatDuration = (ms) => {
    if (ms === 0) return "00:00:00";
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60))); // Allow hours > 24 for total duration

    const pad = (num) => num.toString().padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  // Starts the local timer display interval
  const startTimerInterval = (initialStartTime) => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    const startTimeMs = new Date(initialStartTime).getTime();

    timerIntervalRef.current = setInterval(() => {
      setElapsedTime(Date.now() - startTimeMs);
    }, 1000); // Update every second
  };

  // Stops the local timer display interval
  const stopTimerInterval = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setElapsedTime(0); // Reset elapsed time when stopped
  };

  // Handle starting a timer session
  const handleStartTimer = async (e) => {
    e.stopPropagation(); // Prevent TaskCard's main onClick from firing
    try {
      const response = await axiosInstance.post(API_PATHS.TASKS.START_TIMER(taskId));
      const newTimeLog = response.data.timeLog;
      setIsTimerActive(true);
      setActiveTimeLogId(newTimeLog._id);
      startTimerInterval(newTimeLog.startTime); // Start displaying elapsed time
      toast.success(response.data.message);
    } catch (error) {
      console.error("Error starting timer:", error);
      toast.error(error.response?.data?.message || "Failed to start timer.");
    }
  };

  // Handle stopping a timer session
  const handleStopTimer = async (e) => {
    e.stopPropagation(); // Prevent TaskCard's main onClick from firing
    if (!activeTimeLogId) return; // Should not happen if button is shown correctly

    try {
      const response = await axiosInstance.put(API_PATHS.TASKS.STOP_TIMER(taskId, activeTimeLogId));
      setIsTimerActive(false);
      setActiveTimeLogId(null);
      stopTimerInterval(); // Stop displaying elapsed time
      toast.success(response.data.message);
      // OPTIONAL: You might want to trigger a re-fetch of the parent list of tasks
      // if stopping a timer should immediately update total duration displayed elsewhere.
      // This depends on your app's overall state management.
    } catch (error) {
      console.error("Error stopping timer:", error);
      toast.error(error.response?.data?.message || "Failed to stop timer.");
    }
  };

  // Check for active timer on component mount/taskId change
  useEffect(() => {
    const checkActiveTimer = async () => {
      try {
        const response = await axiosInstance.get(API_PATHS.TASKS.GET_ACTIVE_TIMER(taskId));
        if (response.data.activeTimeLog) {
          const activeLog = response.data.activeTimeLog;
          setIsTimerActive(true);
          setActiveTimeLogId(activeLog._id);
          startTimerInterval(activeLog.startTime); // Resume displaying elapsed time from saved start time
        } else {
          // No active timer found, ensure state is clean
          setIsTimerActive(false);
          setActiveTimeLogId(null);
          stopTimerInterval(); // Ensure any old intervals are cleared
        }
      } catch (error) {
        console.error("Error checking active timer:", error.response?.data?.message || error.message);
        // If an error occurs (e.g., 404 No Active Timer, or other API issue), ensure state is reset
        setIsTimerActive(false);
        setActiveTimeLogId(null);
        stopTimerInterval();
      }
    };

    if (taskId) { // Only check if taskId is valid
      checkActiveTimer();
    }

    // Cleanup interval on component unmount
    return () => stopTimerInterval();
  }, [taskId, currentUser?._id]); // Re-run if taskId or current user changes (important if users switch without full reload)

  const getStatusTagColor = () => {
    switch (status) {
      case 'In Progress':
        return 'text-cyan-500 bg-cyan-50 border border-cyan-500/10';
      case 'Completed':
        return 'text-lime-500 bg-lime-50 border border-lime-500/20';
      default:
        return 'text-violet-500 bg-violet-50 border border-violet-500/10';
    }
  };

  const getPriorityTagColor = () => {
    switch (priority) {
      case 'Low':
        return 'text-emerald-500 bg-emerald-50 border border-emerald-500/10';
      case 'Medium':
        return 'text-amber-500 bg-amber-50 border border-amber-500/10';
      default:
        return 'text-rose-500 bg-rose-50 border border-rose-500/10';
    }
  };

  // Determine if the current user can operate the timer for this task.
  // A user can operate if they are assigned to the task OR if they are an admin.
  const isCurrentUserAssigned = assignedTo?.some(userObj => userObj._id === currentUser?._id);
  const canOperateTimer = isCurrentUserAssigned || currentUser?.role === "admin";

  const navigate=useNavigate();

  const attachmentCount = attachments ? attachments.length : 0; // Calculate attachmentCount from attachments array

return (
        // The main div for the card. The general onClick for task details should be handled by the inner wrapper.
        <div className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition">
            {/* Wrapper for general card click action. Timer controls will stop propagation. */}
            <div className="cursor-pointer" onClick={onClick}>
                {/* Status and Priority Tags */}
                <div className="flex flex-wrap gap-2 mb-3">
                    <div className={`text-[11px] font-medium ${getStatusTagColor()} px-3 py-0.5 rounded`}>
                        {status}
                    </div>
                    <div className={`text-[11px] font-medium ${getPriorityTagColor()} px-3 py-0.5 rounded`}>
                        {priority} Priority
                    </div>
                </div>

                {/* Task Info */}
                <div
                    className={`px-4 py-2 border-l-[3px] mb-4 ${
                        status === 'In Progress'
                            ? 'border-cyan-500'
                            : status === 'Completed'
                            ? 'border-indigo-500'
                            : 'border-violet-500'
                    }`}
                >
                    <p className="text-base font-semibold text-gray-800 mb-1">{title}</p>
                    <p className="text-sm text-gray-600 mb-2">{description}</p>
                    <p className="text-sm text-gray-700 mb-2">
                        Task Done:{' '}
                        <span className="font-medium text-gray-900">
                            {completedTodoCount}/{todoChecklist?.length || 0}
                        </span>
                    </p>
                    <Progress progress={progress} status={status} />
                </div>

                {/* Footer Info (Dates) */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full text-sm text-gray-600 mb-3">
                    <div>
                        <label className="block font-medium text-gray-500">Start Date</label>
                        <p>{moment(createdAt).format('Do MMM YYYY')}</p>
                    </div>
                    <div className="text-right">
                        <label className="block font-medium text-gray-500">Due Date</label>
                        <p>{moment(dueDate).format('Do MMM YYYY')}</p>
                    </div>
                </div>
            </div> {/* End of main card click wrapper */}

            {/* Assignee Names + Attachments + Timer Controls + Time Logs Link (outside the main click wrapper) */}
            <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
                {/* Assignee Names */}
                <div className="flex flex-wrap items-center gap-2">
                    {assignedTo?.length > 0 &&
                        assignedTo.map((userObj, idx) => (
                            <span
                                key={userObj._id || idx}
                                className="bg-gray-100 text-gray-700 text-xs font-medium px-3 py-1 rounded-full"
                            >
                                {userObj.name || 'Unnamed'}
                            </span>
                        ))}

                    {/* Attachments */}
                    {attachmentCount > 0 && (
                        <div className="flex items-center gap-1 text-gray-600 text-sm">
                            <LuPaperclip className="text-lg" />
                            <span>{attachmentCount}</span>
                        </div>
                    )}
                </div>

                {/* Timer Controls (Conditionally rendered) */}
                {status !== 'Completed' && canOperateTimer && (
                    <div className="flex items-center gap-2 ml-auto">
                        <span className="text-lg font-semibold text-gray-700 w-24 text-right">
                            {formatDuration(elapsedTime)}
                        </span>
                        {isTimerActive ? (
                            <FaPauseCircle
                                className="text-red-500 text-3xl cursor-pointer hover:text-red-600 transition"
                                onClick={handleStopTimer}
                            />
                        ) : (
                            <FaPlayCircle
                                className="text-green-500 text-3xl cursor-pointer hover:text-green-600 transition"
                                onClick={handleStartTimer}
                            />
                        )}
                    </div>
                )}

                {/* NEW: Time Logs Link/Button */}
                {/* This button should appear when the timer is not active or for completed tasks where time logs might exist. */}
                {/* Placed it alongside the assignee/attachments, so it's always visible for relevant tasks. */}
                <div className="flex items-center gap-1 text-sm ml-auto"> {/* Removed `text-gray-600` for the button text itself */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent card onClick from triggering
                            // Navigate to the time logs page for this task
                            // We use /user/tasks/:taskId/timelogs for user-facing,
                            // and the router handles admin redirection from /admin/tasks to the same page.
                            navigate(`/user/tasks/${taskId}/timelogs`);
                        }}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors font-medium px-3 py-1 rounded-md bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <FaRegClock className="text-base" />
                        Time Logs
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TaskCard;