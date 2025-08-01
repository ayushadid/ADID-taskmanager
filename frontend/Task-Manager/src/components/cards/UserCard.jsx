import React from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate hook

const UserCard = ({ userInfo }) => {
    const navigate = useNavigate(); // Initialize useNavigate

    const handleCardClick = () => {
        // Navigate to the new user tasks details page
        // Ensure userInfo._id is available
        if (userInfo && userInfo._id) {
            navigate(`/admin/users/${userInfo._id}/tasks`);
        } else {
            console.warn("User ID not found for navigation.");
            // Optionally show a toast error or handle this case gracefully
            // toast.error("Could not find user details to navigate.");
        }
    };

    return (
        // Add cursor-pointer and onClick handler to the main div
        <div
            className='user-card p-4 border rounded-lg shadow-sm bg-white cursor-pointer hover:shadow-md transition-shadow'
            onClick={handleCardClick} // Add the click handler here
        >
            {/* Top: Avatar and Info */}
            <div className='flex items-center gap-3'>
                <img
                    src={userInfo?.profileImageUrl}
                    alt="Avatar"
                    className='w-12 h-12 rounded-full border-2 border-white'
                />
                <div>
                    <p className='text-sm font-medium'>{userInfo?.name}</p>
                    <p className='text-xs text-gray-500'>{userInfo?.email}</p>
                </div>
            </div>

            {/* Bottom: Task Stats */}
            <div className='flex justify-between gap-2 mt-4'>
                <StatCard
                    label="Pending"
                    count={userInfo?.pendingTasks || 0}
                    status="Pending"
                />
                <StatCard
                    label="In Progress"
                    count={userInfo?.inProgressTasks || 0}
                    status="In Progress"
                />
                <StatCard
                    label="Completed"
                    count={userInfo?.completedTasks || 0}
                    status="Completed"
                />
            </div>
        </div>
    );
};

export default UserCard;

const StatCard = ({ label, count, status }) => {
    const getStatusTagColor = () => {
        switch (status) {
            case "In Progress":
                return "text-cyan-500 bg-gray-50";
            case "Completed":
                return "text-indigo-500 bg-gray-50";
            default: // Assuming Pending is default
                return "text-violet-500 bg-gray-50";
        }
    };

    return (
        <div
            className={`flex-1 text-[10px] font-medium ${getStatusTagColor()} px-3 py-2 rounded text-center`}
        >
            <span className='text-[12px] font-semibold block'>{count}</span>
            {label}
        </div>
    );
};