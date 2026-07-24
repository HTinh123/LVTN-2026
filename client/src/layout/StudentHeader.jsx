import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaUser,
  FaBars,
  FaTimes,
  FaGraduationCap,
  FaChartLine,
  FaBell,
  FaSignOutAlt,
  FaChevronDown,
  FaNewspaper,
} from "react-icons/fa";
import logo from "../assets/logo.png";
import { toast } from 'react-toastify';

const StudentHeader = ({ activeTab, onTabChange, user }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();

  const studentName = user?.hoten || user?.username || "Student";
  const studentId = user?.mssv || user?.id || "DH52001001";

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userType');
    toast.success('Đã đăng xuất thành công!');
    navigate('/login', { replace: true });
  };

  const menuItems = [
    { id: 'drl', label: 'Điểm Rèn Luyện', icon: FaGraduationCap },
    { id: 'comp', label: 'Khiếu nại', icon: FaChartLine },
    { id: 'news', label: 'Thông báo', icon: FaNewspaper },
  ];

  return (
    <header className="w-full font-sans bg-[#1169f9] shadow-md sticky top-0 z-50">
      {/* Main Header - No top bar, everything inline */}
      <div className="border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-4">
          
          {/* Mobile Menu Button */}
          <button 
            className="lg:hidden text-white text-xl"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
          </button>

          {/* Logo and Brand */}
          <Link to="/student" className="flex-shrink-0">
            <div className="flex items-center gap-3">
              <img 
                src={logo} 
                alt="Logo" 
                className="h-8 w-auto object-contain"
              />
              <h1 className="text-[20px] md:text-[28px] font-black text-white tracking-tighter leading-none hover:opacity-80 transition-opacity">
                STU - Student Portal
              </h1>
            </div>
          </Link>

          {/* Navigation Menu - Inline with logo and profile */}
          <nav className="hidden lg:flex items-center gap-1 flex-1 justify-left">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors
                    ${isActive 
                      ? 'bg-white/20 text-white' 
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                    }
                  `}
                >
                  <Icon size={14} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Side - Notification & Profile */}
          <div className="flex items-center gap-2">
            {/* Notification Bell */}
            <button className="relative p-1.5 text-white/80 hover:text-white transition-colors">
              <FaBell size={16} />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Student Profile - Compact */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center">
                  <FaUser className="text-white text-xs" />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-white leading-tight">{studentName}</p>
                  <p className="text-[10px] text-white/70">Student</p>
                </div>
                <FaChevronDown className="text-white/60 text-xs" />
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
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">{studentName}</p>
                        <p className="text-xs text-gray-500">MSSV: {studentId}</p>
                        <p className="text-xs text-gray-400 mt-1">Student</p>
                      </div>
                      
                      <button 
                        onClick={() => {
                          setIsProfileOpen(false);
                          navigate('/profile');
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

      {/* Mobile Navigation Menu */}
      <nav className={`lg:hidden bg-[#1a2332] border-b border-gray-700 ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
        <div className="px-4 py-2">
          <ul className="flex flex-col space-y-1">
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
                      flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors w-full
                      ${isActive 
                        ? 'bg-blue-600/20 text-blue-400' 
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

export default StudentHeader;