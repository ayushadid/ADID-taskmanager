import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import Chart from 'react-apexcharts';
import axiosInstance from '../../utils/axiosinstance';
import { API_PATHS } from '../../utils/apiPaths';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

// Helper function to format milliseconds into "Xh Ym"
const formatDuration = (ms) => {
  if (ms < 0) ms = 0;
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

// Helper function to format a Date object to 'YYYY-MM-DD' for the input
const formatDateForInput = (date) => {
  const d = new Date(date);
  let month = '' + (d.getMonth() + 1);
  let day = '' + d.getDate();
  const year = d.getFullYear();
  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;
  return [year, month, day].join('-');
};

const AdminDayView = () => {
  const [date, setDate] = useState(new Date());
  const [series, setSeries] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const navigate = useNavigate();
  const [chartHeight, setChartHeight] = useState(200); // State for dynamic chart height

  // Fetch all users for the dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axiosInstance.get(API_PATHS.USERS.GET_ALL_USERS);
        setUsers(response.data || []);
        if (response.data?.length > 0) {
          setSelectedUserId(response.data[0]._id); // Default to the first user
        }
      } catch (error) {
        toast.error("Could not fetch users.");
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
  }, []);

  // Fetch time logs when the selected user or date changes
  useEffect(() => {
    if (!selectedUserId) return; // Don't fetch if no user is selected

    const fetchTimeLogs = async () => {
      try {
        const formattedDate = formatDateForInput(date);
        const response = await axiosInstance.get(API_PATHS.TIMELOGS.GET_BY_DAY(selectedUserId), {
          params: { date: formattedDate },
        });

        const chartData = response.data.map(log => ({
          x: log.task.title,
          y: [ new Date(log.startTime).getTime(), new Date(log.endTime).getTime() ],
          taskId: log.task._id,
        }));
        setSeries([{ data: chartData }]);

        // Calculate and set the dynamic height
        const baseHeight = 100; // Base height for padding and axes
        const heightPerTask = 65; // Pixels per task row
        const newHeight = baseHeight + (chartData.length * heightPerTask);
        setChartHeight(Math.max(newHeight, 200)); // Set a minimum height

      } catch (error) {
        console.error("Error fetching time logs:", error);
        setSeries([{ data: [] }]);
      }
    };

    fetchTimeLogs();
  }, [date, selectedUserId]);

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const options = {
    chart: {
      type: 'rangeBar',
      height: 450,
      toolbar: { show: false },
      events: {
        dataPointSelection: (event, chartContext, config) => {
          const { taskId } = config.w.config.series[config.seriesIndex].data[config.dataPointIndex];
          if (taskId) navigate('/admin/create-task', { state: { taskId } });
        },
      },
    },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 10,
        barHeight: '35%',
        rangeBarGroupRows: true,
      },
    },
    xaxis: {
      type: 'datetime',
      min: startOfDay.getTime(),
      max: endOfDay.getTime(),
      labels: { datetimeUTC: false, format: 'HH:mm' },
      axisBorder: { show: false },
      axisTicks: { show: true },
    },
    yaxis: {
      show: true,
      labels: {
        style: {
          fontSize: '14px',
          fontWeight: 500,
        }
      }
    },
    grid: {
      show: true,
      borderColor: '#e0e0e0',
      strokeDashArray: 4,
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: false } },
    },
    dataLabels: { enabled: false },
    tooltip: {
      custom: function({ series, seriesIndex, dataPointIndex, w }) {
        const yData = w.config.series[seriesIndex].data[dataPointIndex].y;
        const start = yData[0];
        const end = yData[1];
        const taskName = w.globals.labels[dataPointIndex];
        if (typeof start === 'number' && typeof end === 'number') {
          const duration = formatDuration(end - start);
          return `<div class="p-2"><strong>Task:</strong> ${taskName}<br><strong>Duration:</strong> ${duration}</div>`;
        }
        return `<div class="p-2"><strong>Task:</strong> ${taskName}</div>`;
      }
    },
    fill: { type: 'solid', colors: ['#008FFB'] },
    legend: { show: false },
  };

  return (
    <DashboardLayout activeMenu="Day View">
      <div className="mt-5">
        <h2 className="text-2xl font-semibold text-gray-800">Team Day View</h2>
        <p className="mt-2 text-sm text-gray-600">A timeline of logged work for any user on the selected day.</p>
      </div>
      <div className="card mt-6">
        <div className="flex items-center gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select User</label>
            <select
              className="form-input w-auto"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
            >
              <option value="" disabled>-- Select a User --</option>
              {users.map(user => (
                <option key={user._id} value={user._id}>{user.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Date</label>
            <input
              type="date"
              className="form-input w-auto"
              value={formatDateForInput(date)}
              onChange={(e) => setDate(new Date(e.target.value))}
            />
          </div>
        </div>
        {series[0]?.data.length > 0 ? (
          <Chart options={options} series={series} type="rangeBar" height={chartHeight} />
        ) : (
          <div className="text-center py-10 text-gray-500">No time logs found for this user on this day.</div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminDayView;