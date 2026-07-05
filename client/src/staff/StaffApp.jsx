import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Routes, Route } from 'react-router-dom';
import StaffHeader from '../layout/StaffHeader';
import StudentList from './StudentList';
import AdvisorList from './AdvisorList';
import ClassList from './ClassList';
import KhoaList from './KhoaList';
import DanhmucList from './DanhmucList';
import LoaiList from './LoaiList';
import TieuchiList from './TieuchiList';


function StaffApp() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState({});

  useEffect(() => {
    // Get user data from localStorage
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    const userData = userStr ? JSON.parse(userStr) : {};
    
    setUser(userData);
    
    // Verify staff access (role should be 'staff')
    if (!token || userData.role !== 'staff') {
      navigate('/login', { replace: true });
    }
  }, [navigate]);
  
  // Determine active tab based on current path
  const getActiveTabFromPath = () => {
    const path = location.pathname;
    if (path.includes('/staff/students')) return 'students';
    if (path.includes('/staff/advisors')) return 'advisors';
    if (path.includes('/staff/categories')) return 'categories';
    return 'dashboard';
  };

  const [activeTab, setActiveTab] = useState(getActiveTabFromPath());

  // Handle tab change - navigate to corresponding route
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    switch(tab) {
      case 'dashboard':
        navigate('/staff');
        break;
      case 'students':
        navigate('/staff/students');
        break;
      case 'advisors':
        navigate('/staff/advisors');
        break;
        case 'classes':
        navigate('/staff/classes');
        break;
        case 'departments':
        navigate('/staff/departments');
        break;
        case 'categories':
        navigate('/staff/danhmuc');
        break;
      default:
        navigate('/staff');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <StaffHeader 
        activeTab={activeTab} 
        onTabChange={handleTabChange}
        user={user}
      />

      <div className="py-6 sm:px-6 lg:px-8">
        {/*  */}
          <Routes>
            {/* Dashboard Route */}
            <Route path="/" element={
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                  Welcome, {user.hoten || user.username || 'Staff'}!
                </h2>
                
              </div>
            } />

            {/* Students Management Route */}
            <Route path="/students" element={
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                  Students Management
                </h2>
                <StudentList />
              
              </div>
            } />

            {/* Advisors Management Route */}
            <Route path="/advisors" element={
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                  Advisors Management
                </h2>
                
                <AdvisorList />
              </div>
            } />

            {/* Classes Management Route */}
            <Route path="/classes" element={
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                  Classes Management
                </h2>
                <ClassList />
              </div>
            } />

            {/* Departments Management Route */}
            <Route path="/departments" element={
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                  Departments Management
                </h2>
                <KhoaList />
              </div>
            } />

                     {/* Danhmuc List - Parent Route */}
          <Route 
            path="/danhmuc" 
            element={
        
                <div className="bg-white shadow rounded-lg p-6">
                  <DanhmucList />
                </div>
          
            } 
          />

          {/* Loai List - Nested Route for specific Danhmuc */}
          <Route 
            path="/danhmuc/:ms_danhmuc/loai" 
            element={
           
                <div className="bg-white shadow rounded-lg p-6">
                  <LoaiList />
                </div>
            
            } 
          />

          {/* Tieuchi List - Nested Route for specific Loai */}
          <Route 
            path="/danhmuc/:ms_danhmuc/loai/:ms_loai/tieuchi" 
            element={
             
                <div className="bg-white shadow rounded-lg p-6">
                  <TieuchiList />
                </div>
              
            } 
          />


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
                  onClick={() => navigate('/staff')}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Go to Dashboard
                </button>
              </div>
            } />
          </Routes>
        {/*  */}
      </div>
    </div>
  );
}

export default StaffApp;
