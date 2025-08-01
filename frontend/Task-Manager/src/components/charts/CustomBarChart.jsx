import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

// Helper: get color based on priority
const getBarColor = (entry) => {
  switch (entry?.priority) {
    case 'Low':
      return '#00BC7D';
    case 'Medium':
      return '#FE9900';
    case 'High':
      return '#F04438';
    default:
      return '#8884d8';
  }
};

// Custom tooltip component
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white shadow-md rounded-lg p-2 border border-gray-300">
        <p className="text-xs font-semibold text-purple-800 mb-1">
          {payload[0].payload.priority}
        </p>
        <p className="text-sm text-gray-600">
          Count:{' '}
          <span className="text-sm font-medium text-gray-900">
            {payload[0].payload.count}
          </span>
        </p>
      </div>
    );
  }
  return null;
};

// Main chart component
const CustomBarChart = ({ data = [] }) => {
  const safeData = Array.isArray(data) ? data : [];

  return (
    <div className="bg-white mt-6">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={safeData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="priority"
            tick={{ fontSize: 12, fill: "#555" }}
            stroke="none"
          />
          <YAxis
            tick={{ fontSize: 12, fill: "#555" }}
            stroke="none"
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "transparent" }}
          />
          <Bar
            dataKey="count"
            radius={[10, 10, 0, 0]}
          >
            {safeData.map((entry, index) => (
              <Cell key={index} fill={getBarColor(entry)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CustomBarChart;
