// client/src/layout/ProfileWrapper.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import StudentHeader from './StudentHeader';
import StaffHeader from './StaffHeader';
import AdminHeader from './AdminHeader';
import AdvisorHeader from './AdvisorHeader';
import ProfileDetail from './ProfileDetail';

function ProfileWrapper() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
      } catch (err) {
        console.error('Error parsing user data:', err);
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
    setLoading(false);
  }, [navigate]);

  // Handle tab change with proper navigation
  const handleTabChange = (tab) => {
    const role = user?.role;
    
    switch(role) {
      case 'student':
        // Student navigation
        switch(tab) {
          case 'drl':
            navigate('/student/drl');
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
        break;
        
      case 'staff':
        // Staff navigation
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
        break;
        
      case 'admin':
        // Admin navigation
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
        break;
        
      case 'cvht':
        // CVHT navigation
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
        break;
        
      default:
        navigate('/');
    }
  };

  // Determine active tab based on current path and role
  const getActiveTab = () => {
    const path = location.pathname;
    const role = user?.role;
    
    switch(role) {
      case 'student':
        if (path.includes('/student/drl')) return 'drl';
        if (path.includes('/student/comp')) return 'comp';
        if (path.includes('/student/news')) return 'news';
        return 'drl';
        
      case 'staff':
        if (path.includes('/staff/students')) return 'students';
        if (path.includes('/staff/advisors')) return 'advisors';
        if (path.includes('/staff/classes')) return 'classes';
        if (path.includes('/staff/departments')) return 'departments';
        if (path.includes('/staff/categories')) return 'categories';
        if (path.includes('/staff/profile')) return 'profile';
        return 'dashboard';
        
      case 'admin':
        if (path.includes('/admin/staff')) return 'staff';
        if (path.includes('/admin/profile')) return 'profile';
        return 'dashboard';
        
      case 'cvht':
        if (path.includes('/cvht/classes')) return 'classes';
        if (path.includes('/cvht/profile')) return 'profile';
        return 'dashboard';
        
      default:
        return 'dashboard';
    }
  };

  const activeTab = getActiveTab();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) return null;

  // Get the appropriate header with proper navigation
  const getHeader = () => {
    const role = user.role;
    const commonProps = {
      user: user,
      activeTab: activeTab,
      onTabChange: handleTabChange
    };

    switch(role) {
      case 'student':
        return <StudentHeader {...commonProps} />;
      case 'staff':
        return <StaffHeader {...commonProps} />;
      case 'admin':
        return <AdminHeader {...commonProps} />;
      case 'cvht':
        return <AdvisorHeader {...commonProps} />;
      default:
        return null;
    }
  };

  const Header = getHeader();

  return (
    <div className="min-h-screen bg-gray-100">
      {Header}
      <div className="py-4 sm:px-4 lg:px-6 max-w-7xl mx-auto">
        <ProfileDetail />
      </div>
    </div>
  );
}

export default ProfileWrapper;