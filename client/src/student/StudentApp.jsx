import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Routes, Route } from 'react-router-dom';
import StudentHeader from '../layout/StudentHeader';
import DiemRenLuyen from './DiemRenLuyen';
//import Complaint from './Complaint';

function StudentApp() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState({});

  useEffect(() => {
    // Get user data from localStorage
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    const userData = userStr ? JSON.parse(userStr) : {};
    
    setUser(userData);
    
    // Verify student access (role should be 'student' or 'sinhvien')
    if (!token || (userData.role !== 'student' && userData.role !== 'sinhvien')) {
      navigate('/login', { replace: true });
    }
  }, [navigate]);
  
  // Determine active tab based on current path
  const getActiveTabFromPath = () => {
    const path = location.pathname;
    if (path.includes('/student/comp')) return 'comp';
    // Default to 'drl' for /student or /student/drl
    return 'drl';
  };

  const [activeTab, setActiveTab] = useState(getActiveTabFromPath());

  // Handle tab change - navigate to corresponding route
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    switch(tab) {
      case 'drl':
        navigate('/student');
        break;
      case 'comp':
        navigate('/student/comp');
        break;
      default:
        navigate('/student');
    }
  };

  // The routes content to be passed as children
  const routesContent = (
    <Routes>
      {/* Conduct Score (Điểm Rèn Luyện) Route - Default */}
      <Route path="/" element={
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Điểm Rèn Luyện
          </h2>
          <DiemRenLuyen />
        </div>
      } />

      {/* Alternative path for conduct score */}
      <Route path="/drl" element={
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Điểm Rèn Luyện
          </h2>
          <DiemRenLuyen />
        </div>
      } />

      {/* Complaint (Khiếu nại) Route */}
      <Route path="/comp" element={
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Khiếu Nại
          </h2>
          {/* <Complaint user={user} /> */}
        </div>
      } />

      {/* 404 Route */}
      <Route path="*" element={
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Không Tìm Thấy Trang
          </h2>
          <p className="text-gray-600">
            Trang bạn đang tìm kiếm không tồn tại.
          </p>
          <button 
            onClick={() => navigate('/student')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Về Trang Điểm Rèn Luyện
          </button>
        </div>
      } />
    </Routes>
  );

  return (
    <StudentHeader 
      activeTab={activeTab} 
      onTabChange={handleTabChange}
      user={user}
    >
      {routesContent}
    </StudentHeader>
  );
}

export default StudentApp;