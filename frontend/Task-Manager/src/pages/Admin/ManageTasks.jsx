import React, { useContext, useEffect, useState } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosinstance';
import { API_PATHS } from '../../utils/apiPaths';
import TaskStatusTab from '../../components/TaskStatusTab';
import TaskCard from '../../components/cards/TaskCard';
import { UserContext } from '../../context/userContext';
import { LuRadioTower } from 'react-icons/lu';

const ManageTasks = () => {
    // State for the filtered list shown on screen
    const [displayedTasks, setDisplayedTasks] = useState([]);
    // State for the master list of all tasks
    const [allTasks, setAllTasks] = useState([]);
    const [tabs, setTabs] = useState([]);
    const [projects, setProjects] = useState([]);

    // State for standard filters
    const [filterStatus, setFilterStatus] = useState("All");
    const [assignmentFilter, setAssignmentFilter] = useState("all");
    const [selectedProject, setSelectedProject] = useState('all');

    // 1. New state for the "Live Tasks" switch and its data
    const [showLiveOnly, setShowLiveOnly] = useState(false);
    const [liveTasks, setLiveTasks] = useState([]);

    const { user } = useContext(UserContext);
    const navigate = useNavigate();

    // Fetches initial data (all tasks and all projects) on mount
    useEffect(() => {
        const getInitialData = async () => {
            try {
                const [taskResponse, projectResponse] = await Promise.all([
                    axiosInstance.get(API_PATHS.TASKS.GET_ALL_TASKS),
                    axiosInstance.get(API_PATHS.PROJECTS.GET_ALL_PROJECTS)
                ]);
                
                const tasks = taskResponse.data?.tasks || [];
                setAllTasks(tasks);
                setDisplayedTasks(tasks);
                setProjects(projectResponse.data || []);

                const statusSummary = taskResponse.data?.statusSummary || {};
                const statusArray = [
                    { label: "All", count: statusSummary.all || 0 },
                    { label: "Pending", count: statusSummary.pendingTasks || 0 },
                    { label: "In Progress", count: statusSummary.inProgressTasks || 0 },
                    { label: "Completed", count: statusSummary.completedTasks || 0 },
                ];
                setTabs(statusArray);
            } catch (error) {
                console.error("Error fetching initial data", error);
            }
        };
        getInitialData();
    }, []);

    // Performs client-side filtering when standard filters change
    useEffect(() => {
        let filtered = [...allTasks];
        if (assignmentFilter === 'mine' && user) {
            filtered = filtered.filter(task => 
                task.assignedTo.some(assignedUser => assignedUser._id === user._id)
            );
        }
        if (filterStatus !== 'All') {
            filtered = filtered.filter(task => task.status === filterStatus);
        }
        if (selectedProject !== 'all') {
            filtered = filtered.filter(task => task.project?._id === selectedProject);
        }
        setDisplayedTasks(filtered);
    }, [filterStatus, assignmentFilter, selectedProject, allTasks, user]);

    // 2. New useEffect to fetch live tasks ONLY when the switch is turned on
    useEffect(() => {
        if (showLiveOnly) {
            const fetchLiveTasks = async () => {
                try {
                    const response = await axiosInstance.get(API_PATHS.TIMELOGS.GET_ACTIVE_TIMELOGS);
                    const activeTasks = response.data.map(log => log.task);
                    setLiveTasks(activeTasks);
                } catch (error) {
                    console.error("Error fetching live tasks", error);
                }
            };
            fetchLiveTasks();
        }
    }, [showLiveOnly]);

    const handleClick = (taskData) => {
        navigate(`/admin/create-task`, { state: { taskId: taskData._id } });
    };
    
    // Helper to get button styles
    const getFilterButtonStyle = (filterName) => {
        return assignmentFilter === filterName
            ? 'bg-primary text-white'
            : 'bg-white text-slate-700 border border-slate-300';
    };

    // 4. Decide which list of tasks to render
    const tasksToRender = showLiveOnly ? liveTasks : displayedTasks;

    return (
        <DashboardLayout activeMenu="Manage Tasks">
            <div className='my-5'>
                <div className='flex flex-col md:flex-row md:items-center justify-between'>
                    <h2 className='text-xl md:text-xl font-medium'>Manage Tasks</h2>
                    
                    {/* 3. UI for the "Live Tasks" Switch */}
                    <div className="flex items-center gap-4">
                        <label htmlFor="live-toggle" className="flex items-center cursor-pointer">
                            <LuRadioTower className={`mr-2 ${showLiveOnly ? 'text-red-500' : 'text-slate-400'}`} />
                            <span className={`text-sm font-medium ${showLiveOnly ? 'text-red-500' : 'text-slate-600'}`}>Live Tasks</span>
                            <div className="relative ml-3">
                                <input type="checkbox" id="live-toggle" className="sr-only" checked={showLiveOnly} onChange={() => setShowLiveOnly(!showLiveOnly)} />
                                <div className={`block ${showLiveOnly ? 'bg-red-500' : 'bg-gray-200'} w-12 h-6 rounded-full transition`}></div>
                                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${showLiveOnly ? 'transform translate-x-6' : ''}`}></div>
                            </div>
                        </label>
                    </div>
                </div>

                {/* Standard Filters (disabled when live view is on) */}
                <fieldset disabled={showLiveOnly} className={`flex items-center gap-4 my-4 p-4 bg-white rounded-lg shadow-sm disabled:opacity-40 transition`}>
                    <select className="form-input text-sm" value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}>
                        <option value="all">All Projects</option>
                        {projects.map((project) => (<option key={project._id} value={project._id}>{project.name}</option>))}
                    </select>
                    <div className='flex items-center p-1 bg-slate-200 rounded-md'>
                        <button className={`text-sm font-medium px-3 py-1 rounded-md ${getFilterButtonStyle('all')}`} onClick={() => setAssignmentFilter('all')}>All Tasks</button>
                        <button className={`text-sm font-medium px-3 py-1 rounded-md ${getFilterButtonStyle('mine')}`} onClick={() => setAssignmentFilter('mine')}>My Tasks</button>
                    </div>
                </fieldset>

                {/* Status Tabs (hidden when live view is on) */}
                {!showLiveOnly && tabs?.[0]?.count > 0 && (
                   <div className="flex items-center gap-3 mt-4 md:mt-0">
                     <TaskStatusTab tabs={tabs} activeTab={filterStatus} setActiveTab={setFilterStatus} />
                   </div>
                 )}

                <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-4'>
                    {tasksToRender.map((item) => (
                        <TaskCard key={item._id} task={item} onClick={() => handleClick(item)} />
                    ))}
                </div>
                {tasksToRender.length === 0 && (
                    <div className="text-center py-10 text-gray-500 col-span-3">
                        {showLiveOnly ? "No tasks are currently active." : "No tasks match the current filters."}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default ManageTasks;
