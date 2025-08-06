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
  // 1. Default the view to "all" to show the team view first
  const [selectedUserId, setSelectedUserId] = useState('all');
  const navigate = useNavigate();
  const [chartHeight, setChartHeight] = useState(200);

  // Fetch all users for the dropdown (no change here)
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axiosInstance.get(API_PATHS.USERS.GET_ALL_USERS);
        setUsers(response.data || []);
      } catch (error) {
        toast.error("Could not fetch users.");
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
  }, []);

  // 2. This useEffect now handles both "All Users" and individual user views
  useEffect(() => {
    const fetchTimeLogs = async () => {
      try {
        const formattedDate = formatDateForInput(date);
        let response;
        let chartData;

        if (selectedUserId === 'all') {
          // Fetch data from the new "all users" endpoint
          response = await axiosInstance.get(API_PATHS.TIMELOGS.GET_ALL_BY_DAY, {
            params: { date: formattedDate },
          });
          // Transform data with user name on the Y-axis
          chartData = response.data.map(log => ({
            x: log.user.name, // Use user's name as the category
            y: [ new Date(log.startTime).getTime(), new Date(log.endTime).getTime() ],
            taskId: log.task._id,
            taskTitle: log.task.title, // Store task title for the tooltip
          }));
        } else {
          // Fetch data for a single user (existing logic)
          response = await axiosInstance.get(API_PATHS.TIMELOGS.GET_BY_DAY(selectedUserId), {
            params: { date: formattedDate },
          });
          // Transform data with task title on the Y-axis
          chartData = response.data.map(log => ({
            x: log.task.title, // Use task's title as the category
            y: [ new Date(log.startTime).getTime(), new Date(log.endTime).getTime() ],
            taskId: log.task._id,
          }));
        }

        setSeries([{ data: chartData }]);

        // Dynamically calculate height based on number of unique rows
        const uniqueYCategories = [...new Set(chartData.map(d => d.x))].length;
        const baseHeight = 100;
        const heightPerCategory = 65;
        const newHeight = baseHeight + (uniqueYCategories * heightPerCategory);
        setChartHeight(Math.max(newHeight, 250));

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
      zoom: {
      enabled: true,
    },
      toolbar: { show: false },
      events: {
        dataPointSelection: (event, chartContext, config) => {
          const { taskId } = config.w.config.series[config.seriesIndex].data[config.dataPointIndex];
          if (taskId) navigate(`/user/tasks/${taskId}/timelogs`);
        },
      },
    },
    plotOptions: { bar: { horizontal: true, borderRadius: 10, barHeight: '35%', rangeBarGroupRows: true, } },
    xaxis: { type: 'datetime', min: startOfDay.getTime(), max: endOfDay.getTime(), labels: { datetimeUTC: false, format: 'HH:mm' }, axisBorder: { show: false }, axisTicks: { show: true }, },
    yaxis: { show: true, labels: { style: { fontSize: '14px', fontWeight: 500, } } },
    grid: { show: true, borderColor: '#e0e0e0', strokeDashArray: 4, xaxis: { lines: { show: true } }, yaxis: { lines: { show: false } }, },
    dataLabels: { enabled: false },
    tooltip: {
      // 3. The tooltip now intelligently shows the task title in the "All Users" view
      custom: function({ series, seriesIndex, dataPointIndex, w }) {
        const yData = w.config.series[seriesIndex].data[dataPointIndex].y;
        const start = yData[0];
        const end = yData[1];
        const categoryName = w.globals.labels[dataPointIndex];
        const taskTitle = w.config.series[seriesIndex].data[dataPointIndex].taskTitle;
        const duration = formatDuration(end - start);
        
        const taskHtml = taskTitle ? `<strong>Task:</strong> ${taskTitle}<br>` : '';

        return `<div class="p-2">
                  <strong>${selectedUserId === 'all' ? 'User' : 'Task'}:</strong> ${categoryName}<br>
                  ${taskHtml}
                  <strong>Duration:</strong> ${duration}
                </div>`;
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Select View</label>
            <select
              className="form-input w-auto"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
            >
              {/* 4. The "All Users" option is added to the dropdown */}
              <option value="all">All Users</option>
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
          <div className="text-center py-10 text-gray-500">No time logs found for this selection.</div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminDayView;
