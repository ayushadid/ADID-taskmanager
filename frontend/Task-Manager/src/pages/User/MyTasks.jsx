  import React, { useEffect, useState } from 'react'
  import DashboardLayout from '../../components/layouts/DashboardLayout'
  import { useNavigate } from 'react-router-dom';
  import axiosInstance from '../../utils/axiosinstance';
  import { API_PATHS } from '../../utils/apiPaths';
  import { Label } from 'recharts';
  import { LuFileSpreadsheet } from 'react-icons/lu';
  import TaskStatusTab from '../../components/TaskStatusTab';
  import toast from 'react-hot-toast';
import TaskCard from '../../components/cards/TaskCard';

  const MyTasks = () => {

    const [allTasks,setAllTasks]=useState([]);
    const [tabs,setTabs]=useState([]);
    const [filterStatus,setFilterStatus]=useState("All");

    const navigate=useNavigate();

    const getAllTasks=async()=>{
      try{
        const response=await axiosInstance.get(API_PATHS.TASKS.GET_ALL_TASKS,{
          params:{
            status:filterStatus==="All"?"":filterStatus,
          }
        })
        setAllTasks(response.data?.tasks?.length>0?response.data.tasks:[]);

        //Map status summary
        const statusSummary=response.data?.statusSummary||{};

        const statusArray = [
  { label: "All", count: statusSummary.all || 0 },
  { label: "Pending", count: statusSummary.pendingTasks || 0 },
  { label: "In Progress", count: statusSummary.inProgressTasks || 0 },
  { label: "Completed", count: statusSummary.completedTasks || 0 },
];

        setTabs(statusArray);
      } catch(error){
        console.error("Error catching users",error);
      }
    };

    const handleClick=(taskId)=>{
      navigate(`/user/task-details/${taskId}`);
    };



    useEffect(()=>{
      getAllTasks(filterStatus);
      return ()=>{};
    },[filterStatus]);

    return (
      <DashboardLayout activeMenu="Manage Tasks">
        <div className='my-5'>
          <div className='flex flex-col md:flex-row md:items-center justify-between'>
              <h2 className='text-xl md:text-xl font-medium'>Manage Tasks</h2>
            {tabs?.[0]?.count>0&&(
                <TaskStatusTab 
                  tabs={tabs}
                  activeTab={filterStatus}
                  setActiveTab={setFilterStatus}
                />
            )}
          </div>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-4'>
            {allTasks?.map((item) => ( // Removed `index` from map args as it's not used
                            <TaskCard
                                key={item._id}
                                task={item} // <--- THIS IS THE ONLY CHANGE YOU NEED HERE
                                onClick={() => {
                                    handleClick(item._id);
                                }}
                            />
                        ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  export default MyTasks