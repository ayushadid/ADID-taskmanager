import React, { useContext, useEffect, useState } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosinstance';
import { API_PATHS } from '../../utils/apiPaths';
import { LuFileSpreadsheet } from 'react-icons/lu';
import TaskStatusTab from '../../components/TaskStatusTab';
import toast from 'react-hot-toast';
import TaskCard from '../../components/cards/TaskCard';
import { UserContext } from '../../context/userContext'; // ✨ 1. Import UserContext

const ManageTasks = () => {
    // State for the list that is actually displayed on the screen
    const [displayedTasks, setDisplayedTasks] = useState([]);
    // State to hold the original, complete list from the API
    const [allTasks, setAllTasks] = useState([]);
    
    const [tabs, setTabs] = useState([]);
    const [filterStatus, setFilterStatus] = useState("All");
    const [assignmentFilter, setAssignmentFilter] = useState("all"); // 'all' or 'mine'

    const { user } = useContext(UserContext); // ✨ 2. Get the current user
    const navigate = useNavigate();

    // ✨ 3. This function now only fetches ALL tasks, once.
    const getAllTasks = async () => {
        try {
            // Fetch without any parameters to get everything
            const response = await axiosInstance.get(API_PATHS.TASKS.GET_ALL_TASKS);
            
            const tasks = response.data?.tasks || [];
            setAllTasks(tasks);
            setDisplayedTasks(tasks); // Initially, display all tasks

            // This status summary is for ALL tasks and won't change with filtering
            const statusSummary = response.data?.statusSummary || {};
            const statusArray = [
                { label: "All", count: statusSummary.all || 0 },
                { label: "Pending", count: statusSummary.pendingTasks || 0 },
                { label: "In Progress", count: statusSummary.inProgressTasks || 0 },
                { label: "Completed", count: statusSummary.completedTasks || 0 },
            ];
            setTabs(statusArray);
        } catch (error) {
            console.error("Error fetching tasks", error);
        }
    };

    // ✨ 4. This useEffect fetches the data only when the component mounts
    useEffect(() => {
        getAllTasks();
    }, []);

    // ✨ 5. This new useEffect performs the client-side filtering whenever a filter changes
    useEffect(() => {
        let filtered = [...allTasks];

        // First, filter by assignment
        if (assignmentFilter === 'mine' && user) {
            filtered = filtered.filter(task => 
                task.assignedTo.some(assignedUser => assignedUser._id === user._id)
            );
        }

        // Then, filter by status
        if (filterStatus !== 'All') {
            filtered = filtered.filter(task => task.status === filterStatus);
        }

        setDisplayedTasks(filtered);

    }, [filterStatus, assignmentFilter, allTasks, user]);


    const handleClick = (taskData) => {
        navigate(`/admin/create-task`, { state: { taskId: taskData._id } });
    };

    // ... your download report function ...
    const handleDownloadReport = async () => { /* ... */ };

    // Helper to get button styles
    const getFilterButtonStyle = (filterName) => {
        return assignmentFilter === filterName
            ? 'bg-primary text-white'
            : 'bg-white text-slate-700 border border-slate-300';
    };

    return (
        <DashboardLayout activeMenu="Manage Tasks">
            <div className='my-5'>
                <div className='flex flex-col md:flex-row md:items-center justify-between'>
                    <div className='flex items-center gap-4'>
                        <h2 className='text-xl md:text-xl font-medium'>Manage Tasks</h2>
                        {/* UI buttons for the new filter */}
                        <div className='flex items-center p-1 bg-slate-200 rounded-md'>
                            <button
                                className={`text-sm font-medium px-3 py-1 rounded-md transition-colors duration-200 ${getFilterButtonStyle('all')}`}
                                onClick={() => setAssignmentFilter('all')}
                            >
                                All Tasks
                            </button>
                            <button
                                className={`text-sm font-medium px-3 py-1 rounded-md transition-colors duration-200 ${getFilterButtonStyle('mine')}`}
                                onClick={() => setAssignmentFilter('mine')}
                            >
                                My Tasks
                            </button>
                        </div>
                    </div>
                     {tabs?.[0]?.count > 0 && (
                       <div className="flex items-center gap-3 mt-4 md:mt-0">
                         <TaskStatusTab
                           tabs={tabs}
                           activeTab={filterStatus}
                           setActiveTab={setFilterStatus}
                         />
                         {/* ... download button ... */}
                       </div>
                     )}
                </div>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-4'>
                    {/* Render the filtered list */}
                    {displayedTasks.map((item) => (
                        <TaskCard
                            key={item._id}
                            task={item}
                            onClick={() => handleClick(item)}
                        />
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ManageTasks;