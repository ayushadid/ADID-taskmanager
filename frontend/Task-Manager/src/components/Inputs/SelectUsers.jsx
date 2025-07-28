import React, { useEffect, useState } from 'react';
import axiosInstance from '../../utils/axiosinstance';
import { API_PATHS } from '../../utils/apiPaths';
import { LuUsers } from 'react-icons/lu'; // Assuming LuUser is not directly used for display
import Modal from '../Modal';
import AvatarGroup from '../AvatarGroup';

const SelectUsers = ({selectedUsers,setSelectedUsers}) => {
    const [allUsers,setAllUsers]=useState([]);
    const [isModalOpen,setIsModalOpen]=useState(false);
    const [tempSelectedUsers,setTempSelectedUsers]=useState([]);

    const getAllUsers=async()=>{
        try{
            const response=await axiosInstance.get(API_PATHS.USERS.GET_ALL_USERS);
            if(response.data?.length>0){
                setAllUsers(response.data);
            }
        } catch(error){
            console.error("Error fetching users: ",error);
        }
    };

    const toggleUserSelection=(userId)=>{
        setTempSelectedUsers((prev)=>
            prev.includes(userId)
                ? prev.filter((id)=>id!==userId)
                : [...prev,userId]
        );
    };

    const handleAssign=()=>{
        setSelectedUsers(tempSelectedUsers);
        setIsModalOpen(false);
    }

    const selectedUserAvatars=allUsers
        .filter((user)=>selectedUsers.includes(user._id))
        .map((user)=>user.profileImageUrl);

    useEffect(()=>{
        getAllUsers();
    },[]);

    // --- FIX START ---
    // Initialize tempSelectedUsers with selectedUsers when modal opens or selectedUsers changes
    useEffect(()=>{
        // When the modal opens (isModalOpen becomes true) AND
        // the selectedUsers prop (from CreateTask) actually has users,
        // set tempSelectedUsers to reflect those.
        // Also, when selectedUsers changes (e.g., from CreateTask's useEffect), update tempSelectedUsers.
        if (isModalOpen && selectedUsers.length > 0 && JSON.stringify(tempSelectedUsers.sort()) !== JSON.stringify(selectedUsers.sort())) {
            // Use JSON.stringify for a deep comparison of array contents
            // to prevent infinite loops if state is set unnecessarily.
            setTempSelectedUsers(selectedUsers);
        } else if (!isModalOpen && selectedUsers.length === 0 && tempSelectedUsers.length > 0) {
            // When modal closes and parent selectedUsers is empty, ensure temp is also empty.
            setTempSelectedUsers([]);
        }
    },[isModalOpen, selectedUsers]); // Depend on isModalOpen and selectedUsers

    // It's often cleaner to manage tempSelectedUsers when the modal's open state changes.
    const handleOpenModal = () => {
        setTempSelectedUsers(selectedUsers); // Initialize temp state with current selections
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        // Option 1: Reset tempSelectedUsers to original upon close (cancel like behavior)
        // setTempSelectedUsers(selectedUsers);
        // Option 2: Just close, changes are committed only by handleAssign
        setIsModalOpen(false);
    };
    // --- FIX END ---


    return (
        <div className='space-y-4 mt-2'>
            {selectedUserAvatars.length === 0 && (
                <button className='card-btn' onClick={handleOpenModal}> {/* Use new handler */}
                    <LuUsers className='text-sm' /> Add Members
                </button>
            )}

            {selectedUserAvatars.length > 0 && (
                <div className='cursor-pointer' onClick={handleOpenModal}> {/* Use new handler */}
                    <AvatarGroup avatars={selectedUserAvatars} maxVisible={3}/>
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal} // Use new handler
                title="Select Users"
            >
                <div className='space-y-4 h-[60vh] overflow-y-auto'>
                    {allUsers.map((user)=>(
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
                                    checked={tempSelectedUsers.includes(user._id)} // This check is correct
                                    onChange={()=>toggleUserSelection(user._id)}
                                    className='w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded-sm outline-none'
                               />
                        </div>
                    ))}
                </div>

                <div className='flex justify-end gap'> {/* Typo: 'gap' should be 'gap-x' or 'gap-y' if not for space-between */}
                    <button className='card-btn' onClick={handleCloseModal}> {/* Use new handler */}
                        CANCEL
                    </button>
                    <button className='card-btn-fill' onClick={handleAssign}>
                        DONE
                    </button>
                </div>
            </Modal>
        </div>
    );
}

export default SelectUsers