// client/src/advisor/AdvisorDrlView.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import DiemRenLuyen from '../student/DiemRenLuyen';

function AdvisorDrlView() {
  const navigate = useNavigate();
  const location = useLocation();
  const { mssv } = useParams(); // Get student MSSV from URL if present
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : {};

  // Determine active tab based on current path
  const getActiveTabFromPath = () => {
    const path = location.pathname;
    if (path.includes('/cvht/drl')) return 'classes';
    if (path.includes('/cvht/classes')) return 'classes';
    if (path.includes('/cvht/students')) return 'classes';
    return 'dashboard';
  };

  const [activeTab, setActiveTab] = useState(getActiveTabFromPath());

  // Handle tab change - navigate to corresponding route
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    switch(tab) {
      case 'dashboard':
        navigate('/cvht');
        break;
      case 'classes':
        navigate('/cvht/classes');
        break;
      default:
        navigate('/cvht');
    }
  };

  // Handle back navigation to class list
  const handleBack = () => {
    navigate('/cvht/classes');
  };

  // Handle back to student list from specific class
  const handleBackToClass = () => {
    // Get the class from URL or state
    const path = location.pathname;
    const match = path.match(/\/cvht\/classes\/([^/]+)\/students/);
    if (match) {
      navigate(`/cvht/classes/${match[1]}/students`);
    } else {
      navigate('/cvht/classes');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
     
      <div className="py-4 sm:px-4 lg:px-6 max-w-7xl mx-auto">
        {/* Back navigation - shows when viewing student DRL */}
        {mssv && (
          <div className="mb-4">
            <button
              onClick={handleBackToClass}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Quay lại danh sách lớp
            </button>
          </div>
        )}
        <DiemRenLuyen />
      </div>
    </div>
  );
}

export default AdvisorDrlView;