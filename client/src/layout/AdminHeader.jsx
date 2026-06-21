import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaUser,
  FaBars,
  FaTimes,
  FaChartLine,
  FaUsers,
  FaBell,
  FaSignOutAlt
} from "react-icons/fa";
import logo from "../assets/logo.png";
import { toast } from 'react-toastify';

const AdminHeader = ({ activeTab, onTabChange, user }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();

  // Use user prop or fallback to hardcoded values
  const adminName = user?.hoten || user?.username || "Admin";
  const adminEmail = user?.email || "admin@example.com";

  // Uncomment logout logic when ready
  const handleLogout = () => {
    // Clear all localStorage items
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userType');
    
    // Show success message
    toast.success('Đã đăng xuất thành công!');
    
    // Redirect to login page
    navigate('/login', { replace: true });
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: FaChartLine },
    { id: 'staff', label: 'Staff', icon: FaUsers },
  ];

  return (
    <header className="w-full font-sans bg-[#1169f9] shadow-md sticky top-0 z-50">
      {/* Minimal Top Bar */}
      <div className="bg-[#1169f9] text-white text-xs py-1.5">
        <div className="max-w-7xl mx-auto px-4 flex justify-end items-center gap-4">
          <span>Admin Panel</span>
          <span className="text-gray-400">|</span>
          <span>Version 1.0</span>
        </div>
      </div>

      {/* Main Header */}
      <div className="border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          
          {/* Mobile Menu Button */}
          <button 
            className="lg:hidden text-white text-xl"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
          </button>

          {/* Logo and Brand */}
          <Link to="/admin" className="flex-shrink-0">
            <div className="flex items-center gap-3">
              <img 
                src={logo} 
                alt="Logo" 
                className="h-10 w-auto object-contain"
              />
              <h1 className="text-[24px] md:text-[32px] font-black text-white tracking-tighter leading-none hover:opacity-80 transition-opacity">
                Admin Panel STU
              </h1>
            </div>
          </Link>

          {/* Right Side - Admin Profile & Notifications */}
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <button className="relative p-2 text-gray-300 hover:text-white transition-colors">
              <FaBell size={18} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full"></span>
            </button>

            {/* Admin Profile */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <FaUser className="text-white text-sm" />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold text-white">{adminName}</p>
                  <p className="text-xs text-gray-400">Administrator</p>
                </div>
              </button>

              {/* Dropdown Menu */}
              {isProfileOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40"
                    onClick={() => setIsProfileOpen(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="py-2">
                      {/* User Info Section */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">{adminName}</p>
                        <p className="text-xs text-gray-500">{adminEmail}</p>
                        <p className="text-xs text-gray-400 mt-1">Role: Admin</p>
                      </div>
                      
                      <button 
                        onClick={() => {
                          setIsProfileOpen(false);
                          navigate('/admin/profile');
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <FaUser size={14} />
                        Profile Settings
                      </button>
                      
                      <button 
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2 border-t border-gray-100 mt-1 pt-2"
                      >
                        <FaSignOutAlt size={14} />
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className={`bg-[#1a2332] border-b border-gray-700 ${isMobileMenuOpen ? 'block' : 'hidden'} lg:block`}>
        <div className="max-w-7xl mx-auto px-4">
          <ul className="flex flex-col lg:flex-row lg:space-x-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      onTabChange(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`
                      flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors w-full lg:w-auto
                      ${isActive 
                        ? 'text-blue-400 border-b-2 border-blue-400 lg:border-b-2 bg-blue-900/20' 
                        : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                      }
                    `}
                  >
                    <Icon size={16} />
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    </header>
  );
};

export default AdminHeader;