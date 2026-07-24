import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Routes, Route } from 'react-router-dom';
import AdvisorHeader from '../layout/AdvisorHeader';
import AdvisorClassList from './AdvisorClassList';
import ClassStudentList from './ClassStudentList';
import AdvisorDrlView from './AdvisorDrlView';

function AdvisorApp() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState({});

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    const userData = userStr ? JSON.parse(userStr) : {};
    
    setUser(userData);
    
    if (!token || userData.role !== 'cvht') {
      navigate('/login', { replace: true });
    }
  }, [navigate]);
  
  const getActiveTabFromPath = () => {
    const path = location.pathname;
    if (path.includes('/cvht/classes')) return 'classes';
    return 'dashboard';
  };

  const [activeTab, setActiveTab] = useState(getActiveTabFromPath());

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

  return (
    <div className="min-h-screen bg-gray-100">
      <AdvisorHeader 
        activeTab={activeTab} 
        onTabChange={handleTabChange}
        user={user}
      />

      <div className="py-6 sm:px-6 lg:px-8">
        <Routes>
          {/* Dashboard Route */}
          <Route path="/" element={
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                Welcome, {user.hoten || user.username || 'Advisor'}!
              </h2>
            </div>
          } />

          {/* Classes Route */}
          <Route path="/classes" element={
            <div className="bg-white shadow rounded-lg p-6">
              <AdvisorClassList />
            </div>
          } />

          <Route path="/drl/:mssv?" element={
  <div className="bg-white shadow rounded-lg p-6">
    <AdvisorDrlView />
  </div>
} />

          {/* Class Students Route */}
          <Route path="/classes/:mslop/students" element={
            <div className="bg-white shadow rounded-lg p-6">
              <ClassStudentList />
            </div>
          } />

          {/* 404 Route */}
          <Route path="*" element={
            <div className="bg-white shadow rounded-lg p-6 text-center">
              <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                Page Not Found
              </h2>
              <p className="text-gray-600">
                The page you're looking for doesn't exist.
              </p>
              <button 
                onClick={() => navigate('/cvht')}  // ← Changed from /advisor to /cvht
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

export default AdvisorApp;