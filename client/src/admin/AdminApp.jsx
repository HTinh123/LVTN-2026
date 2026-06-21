import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Routes, Route } from 'react-router-dom';
import AdminHeader from '../layout/AdminHeader';
import PageWrapper from '../components/PageWrapper';
import StaffList from './StaffList'; 


function AdminApp() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState({});

  useEffect(() => {
    // Get user data from localStorage
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    const userData = userStr ? JSON.parse(userStr) : {};
    
    setUser(userData);
    
    // Verify admin access (role should be 'admin')
    if (!token || userData.role !== 'admin') {
      navigate('/login', { replace: true });
    }
  }, [navigate]);
  
  // Determine active tab based on current path
  const getActiveTabFromPath = () => {
    const path = location.pathname;
    if (path.includes('/admin/staff')) return 'staff';
    // Add more tabs as needed
    return 'dashboard';
  };

  const [activeTab, setActiveTab] = useState(getActiveTabFromPath());

  // Handle tab change - navigate to corresponding route
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    switch(tab) {
      case 'dashboard':
        navigate('/admin');
        break;
      case 'staff':
        navigate('/admin/staff');
        break;
      default:
        navigate('/admin');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminHeader 
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
                  Welcome, {user.hoten || user.username || 'Admin'}!
                </h2>
                <p className="text-gray-600 mb-6">
                  This is your admin dashboard. Use the navigation menu to manage the system.
                </p>
                
              
              </div>
            } />

            {/* Staff Management Route */}
            <Route path="/staff" element={
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                  Staff Management
                </h2>
                
                <StaffList />
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
                  onClick={() => navigate('/admin')}
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

export default AdminApp;