import React, { useState } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';

// --- Define your two Google Sheet links here ---
const SHEET_ONE = {
  name: "ADID Calendar", // Give it a descriptive name
  url: "https://docs.google.com/spreadsheets/d/10JbucHYJ2V32cr68QI8coaHLunksKWQYve8ryxJZRi4/edit?gid=1075011649#gid=1075011649",
};

const SHEET_TWO = {
  name: "Website Development", // Give it a descriptive name
  url: "https://docs.google.com/spreadsheets/d/1yTOg_ONNysaF2Z-EwHkPmPbcGTQIHqc5BB3WBzr3hmY/edit?ouid=100644699898020989570&usp=sheets_home&ths=true", // 👈 IMPORTANT: Replace with your second sheet's URL
};
// ---

const SharedSheet = () => {
  // State to hold the URL of the currently active sheet, defaulting to the first one
  const [activeSheet, setActiveSheet] = useState(SHEET_ONE);

  // We add "?rm=minimal" to the end of the URL to hide the Google Sheets header and toolbar
  const embedUrl = `${activeSheet.url}?rm=minimal`;

  // Function to create the button style based on whether it's active
  const getButtonClass = (sheet) => {
    const baseClass = "px-4 py-2 text-sm font-medium rounded-t-lg focus:outline-none";
    if (sheet.url === activeSheet.url) {
      return `${baseClass} bg-white border-b-2 border-white text-primary`; // Active tab style
    }
    return `${baseClass} bg-gray-100 text-gray-500 hover:bg-gray-200`; // Inactive tab style
  };

  return (
    <DashboardLayout activeMenu="Shared Sheet">
      <div className="mt-5">
        <h2 className="text-2xl font-semibold text-gray-800">Shared Spreadsheets</h2>
        <p className="mt-2 text-sm text-gray-600">
          Select a sheet to view its content.
        </p>
      </div>

      {/* 👇 NEW: Buttons to switch between sheets 👇 */}
      <div className="mt-6 border-b border-gray-200">
        <nav className="flex space-x-2">
          <button
            onClick={() => setActiveSheet(SHEET_ONE)}
            className={getButtonClass(SHEET_ONE)}
          >
            {SHEET_ONE.name}
          </button>
          <button
            onClick={() => setActiveSheet(SHEET_TWO)}
            className={getButtonClass(SHEET_TWO)}
          >
            {SHEET_TWO.name}
          </button>
        </nav>
      </div>

      {/* Embedded Sheet Iframe */}
      <div className="w-full h-[75vh] bg-white pt-1">
        <iframe
          key={activeSheet.url} // Adding a key ensures the iframe reloads when the src changes
          src={embedUrl}
          width="100%"
          height="100%"
          frameBorder="0"
          style={{ border: 'none' }}
        >
          Loading…
        </iframe>
      </div>
    </DashboardLayout>
  );
};

export default SharedSheet;