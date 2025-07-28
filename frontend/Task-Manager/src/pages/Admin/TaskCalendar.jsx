import React, { useState } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; // Import default styling

const TaskCalendar = () => {
  // State to hold the currently selected date
  const [value, onChange] = useState(new Date());

  return (
    <DashboardLayout activeMenu="Calendar">
      <div className="mt-5">
        <h2 className="text-2xl font-semibold text-gray-800">Task Calendar</h2>
        <p className="mt-2 text-sm text-gray-600">
          Select a date to view due tasks.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 mt-6">
        {/* Calendar Component */}
        <div className="md:w-1/2">
          <div className="card">
            <Calendar onChange={onChange} value={value} />
          </div>
        </div>

        {/* Task List for Selected Date (Placeholder) */}
        <div className="md:w-1/2">
          <div className="card">
            <h3 className="font-semibold text-lg">
              Tasks Due On: {value.toLocaleDateString()}
            </h3>
            <div className='mt-4'>
              {/* We will fetch and display tasks here */}
              <p className='text-sm text-gray-500'>No tasks for this date.</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TaskCalendar;