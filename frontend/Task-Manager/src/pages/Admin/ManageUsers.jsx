import React, { useEffect, useState } from 'react'
import axiosInstance from '../../utils/axiosinstance';
import { API_PATHS } from '../../utils/apiPaths';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { LuFileSpreadsheet } from 'react-icons/lu';
import UserCard from '../../components/cards/UserCard';
import toast from 'react-hot-toast';

const ManageUsers = () => {

  const[allUsers,setAllUsers]=useState([]);

  const getAllUsers=async()=>{
    try{
      const response=await axiosInstance.get(API_PATHS.USERS.GET_ALL_USERS);
      if(response.data?.length>0){
        setAllUsers(response.data)
      }
    } catch(error){
      console.error("Error fetching usres",error);
    }
  }

    // Download task report
const handleDownloadReport = async () => {
  try {
    const response = await axiosInstance.get(API_PATHS.REPORTS.EXPORT_USERS, {
      responseType: "blob",
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "user_details.xlsx");
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error downloading user details:", error);
    toast.error("Failed to download user details. Please try again.");
  }
};


  useEffect(()=>{
    getAllUsers();
    return()=>{};
  },[])
  return (
  <DashboardLayout activeMenu="Team Members">
    <div className="mt-5 mb-10">
      <div className="flex md:flex-row md:items-center justify-between">
        <h2 className="text-xl font-medium">Team Members</h2>
        <button
          className="flex md:flex download-btn"
          onClick={handleDownloadReport}
        >
          <LuFileSpreadsheet className="text-lg" />
          Download Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        {allUsers?.map((user) => (
          <UserCard key={user._id} userInfo={user} />
        ))}
      </div>
    </div>
  </DashboardLayout>
);

}

export default ManageUsers