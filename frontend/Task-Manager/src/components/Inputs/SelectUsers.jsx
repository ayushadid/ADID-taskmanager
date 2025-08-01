import React, { useEffect, useState } from 'react';
import axiosInstance from '../../utils/axiosinstance';
import { API_PATHS } from '../../utils/apiPaths';
import { LuUsers } from 'react-icons/lu';
import Modal from '../Modal';
// We no longer need AvatarGroup
// import AvatarGroup from '../AvatarGroup';

const SelectUsers = ({ selectedUsers, setSelectedUsers }) => {
    const [allUsers, setAllUsers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [tempSelectedUsers, setTempSelectedUsers] = useState([]);

    const getAllUsers = async () => {
        try {
            const response = await axiosInstance.get(API_PATHS.USERS.GET_ALL_USERS);
            if (response.data?.length > 0) {
                setAllUsers(response.data);
            }
        } catch (error) {
            console.error("Error fetching users: ", error);
        }
    };

    const toggleUserSelection = (userId) => {
        setTempSelectedUsers((prev) =>
            prev.includes(userId)
                ? prev.filter((id) => id !== userId)
                : [...prev, userId]
        );
    };

    const handleAssign = () => {
        setSelectedUsers(tempSelectedUsers);
        setIsModalOpen(false);
    };
    
    // --- START: MODIFIED PART ---
    // Get the full user objects and then map to their names
    const selectedUserNames = allUsers
        .filter((user) => selectedUsers.includes(user._id))
        .map((user) => user.name);
    // --- END: MODIFIED PART ---


    useEffect(() => {
        getAllUsers();
    }, []);

    const handleOpenModal = () => {
        setTempSelectedUsers(selectedUsers);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    return (
        <div className='mt-2'>
            {selectedUserNames.length === 0 ? (
                // Button to open modal when no users are selected
                <button className='card-btn' onClick={handleOpenModal}>
                    <LuUsers className='text-sm' /> Add Members
                </button>
            ) : (
                // --- START: NEW DISPLAY FOR NAMES ---
                // Show the list of names, which is also clickable
                <div
                    className='flex items-center gap-2 p-2 border border-gray-300 rounded-md bg-gray-50 cursor-pointer min-h-[40px]'
                    onClick={handleOpenModal}
                >
                    <LuUsers className='text-slate-600 flex-shrink-0' />
                    <p className='text-sm text-slate-800 truncate'>
                        {selectedUserNames.join(', ')}
                    </p>
                </div>
                // --- END: NEW DISPLAY FOR NAMES ---
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title="Select Users"
            >
                <div className='space-y-4 h-[60vh] overflow-y-auto'>
                    {allUsers.map((user) => (
                        <div
                            key={user._id}
                            className='flex items-center gap-4 p-3 border-b border-gray-200'
                        >
                            <img
                                src={user.profileImageUrl}
                                alt={user.name}
                                className='w-10 h-10 rounded-full'
                            />
                            <div className='flex-1'>
                                <p className='font-medium text-gray-800 dark:text-white'>
                                    {user.name}
                                </p>
                                <p className='text-[13px] text-gray-500'>{user.email}</p>
                            </div>
                            <input type="checkbox"
                                checked={tempSelectedUsers.includes(user._id)}
                                onChange={() => toggleUserSelection(user._id)}
                                className='w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded-sm outline-none'
                            />
                        </div>
                    ))}
                </div>

                <div className='flex justify-end gap-3 pt-4'>
                    <button className='card-btn' onClick={handleCloseModal}>
                        CANCEL
                    </button>
                    <button className='add-btn' onClick={handleAssign}>
                        DONE
                    </button>
                </div>
            </Modal>
        </div>
    );
}

export default SelectUsers;