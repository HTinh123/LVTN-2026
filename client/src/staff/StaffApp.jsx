import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Routes, Route } from 'react-router-dom';
import StaffHeader from '../layout/StaffHeader';
import PageWrapper from '../components/PageWrapper';
//import StudentList from './StudentList';
import AdvisorList from './AdvisorList';


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
        <PageWrapper>
          <Routes>
            {/* Dashboard Route */}
            <Route path="/" element={
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                  Welcome, {user.hoten || user.username || 'Staff'}!
                </h2>
                <p className="text-gray-600 mb-6">
                  This is your staff dashboard. Use the navigation menu to manage students and advisors.
                </p>
              </div>
            } />

            {/* Students Management Route */}
            <Route path="/students" element={
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                  Students Management
                </h2>
                
              
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
        </PageWrapper>
      </div>
    </div>
  );
}

export default StaffApp;
