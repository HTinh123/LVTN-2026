import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Routes, Route } from 'react-router-dom';
import StudentHeader from '../layout/StudentHeader';
import DiemRenLuyen from './DiemRenLuyen';
import ThongBao from './ThongBao';

function StudentApp() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState({});

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    const userData = userStr ? JSON.parse(userStr) : {};
    
    setUser(userData);
    
    if (!token || userData.role !== 'student') {
      navigate('/login', { replace: true });
    }
  }, [navigate]);
  
  const getActiveTabFromPath = () => {
    const path = location.pathname;
    if (path.includes('/student/drl')) return 'drl';
    if (path.includes('/student/comp')) return 'comp';
    if (path.includes('/student/news')) return 'news';
    return 'drl';
  };

  const [activeTab, setActiveTab] = useState(getActiveTabFromPath());

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    switch(tab) {
      case 'drl':
        navigate('/student');
        break;
      case 'comp':
        navigate('/student/comp');
        break;
      case 'news':
        navigate('/student/news');
        break;
      default:
        navigate('/student');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <StudentHeader 
        activeTab={activeTab} 
        onTabChange={handleTabChange}
        user={user}
      />

      <div className="py-4 sm:px-4 lg:px-6 max-w-7xl mx-auto">
        <Routes>
          <Route path="/" element={<DiemRenLuyen />} />

           {/* DRL Route with student parameter - shows specific student's DRL */}
          <Route path="/drl/:mssv" element={<DiemRenLuyen />} />
          <Route path="/drl" element={<DiemRenLuyen />} />
          
          <Route path="/news" element={<ThongBao />} />
          <Route path="/news/:mssv" element={<ThongBao />} />
          

          <Route path="/comp" element={
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                Khiếu nại
              </h2>
              <p className="text-gray-600">
                Trang khiếu nại - Coming soon.
              </p>
            </div>
          } />

          <Route path="*" element={
            <div className="bg-white shadow rounded-lg p-6 text-center">
              <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                Page Not Found
              </h2>
              <p className="text-gray-600">
                The page you're looking for doesn't exist.
              </p>
              <button 
                onClick={() => navigate('/student')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          } />
        </Routes>
      </div>
    </div>
  );
}

export default StudentApp;