// staff/StaffDrlView.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import StaffHeader from '../layout/StaffHeader';
import DiemRenLuyen from '../student/DiemRenLuyen';

function StaffDrlView() {
  const navigate = useNavigate();
  const location = useLocation();
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : {};

  // Determine active tab based on current path
  const getActiveTabFromPath = () => {
    const path = location.pathname;
    if (path.includes('/staff/drl')) return 'students';
    if (path.includes('/staff/students')) return 'students';
    if (path.includes('/staff/advisors')) return 'advisors';
    if (path.includes('/staff/classes')) return 'classes';
    if (path.includes('/staff/departments')) return 'departments';
    if (path.includes('/staff/categories')) return 'categories';
    if (path.includes('/staff/hoatdong')) return 'activities';
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
        navigate('/staff/categories');
        break;
      case 'activities':
        navigate('/staff/hoatdong');
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
      <div className="py-4 sm:px-4 lg:px-6 max-w-7xl mx-auto">
        <DiemRenLuyen />
      </div>
    </div>
  );
}

export default StaffDrlView;