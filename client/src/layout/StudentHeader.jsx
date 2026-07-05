import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUser,
  FaBars,
  FaTimes,
  FaChartLine,
  FaGraduationCap,
  FaBell,
  FaSignOutAlt,
  FaUserCircle,
  FaCog,
  FaChevronDown
} from "react-icons/fa";
import logo from "../assets/logo.png";
import { toast } from 'react-toastify';

const StudentHeader = ({ activeTab, onTabChange, user, children }) => {  // Added children prop
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState("HK1 - 2026");
  const navigate = useNavigate();

  // Use user prop or fallback to hardcoded values
  const studentName = user?.hoten || user?.username || "Student";
  const studentId = user?.mssv || user?.id || "DH52001001";
  
  // Hardcoded values for DRL and ranking
  const drlScore = 85;
  const ranking = drlScore >= 90 ? "Xuất sắc" :
                  drlScore >= 80 ? "Giỏi" :
                  drlScore >= 70 ? "Khá" :
                  drlScore >= 60 ? "Trung bình" : "Yếu";

  // Semester options (hardcoded for now)
  const semesters = [
    { id: 1, name: "HK1 - 2026" },
    { id: 2, name: "HK2 - 2025" },
    { id: 3, name: "HK1 - 2025" },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userType');
    toast.success('Đã đăng xuất thành công!');
    navigate('/login', { replace: true });
  };

  const menuItems = [    
    { id: 'drl', label: 'Điểm Rèn Luyện', icon: FaGraduationCap },
    { id: 'comp', label: 'Khieu nại', icon: FaChartLine },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar - 1/4 width */}
      <aside className={`w-1/4 bg-white shadow-lg border-r border-gray-200 flex flex-col transition-all duration-300 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 fixed lg:relative z-40 h-full`}>
        {/* Sidebar Header */}
        <div className="p-6 ">
          <div className="flex items-center gap-3">
            <img 
              src={logo} 
              alt="Logo" 
              className="h-10 w-auto object-contain"
            />
            <h2 className="text-xl font-bold text-[#1169f9]">STU - Điểm Rèn Luyện</h2>
          </div>
        </div>

        {/* User Greeting */}
        <div className="p-6  bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
              <FaUser className="text-white text-xl" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{studentName}</p>
              <p className="text-xs text-gray-500">MSSV: {studentId}</p>
            </div>
          </div>
        </div>

        {/* Semester Dropdown */}
        <div className="p-4 ">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Học kỳ</label>
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="mt-1 w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            {semesters.map((sem) => (
              <option key={sem.id} value={sem.name}>
                {sem.name}
              </option>
            ))}
          </select>
        </div>

        {/* DRL and Ranking */}
        <div className="p-4  space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Điểm rèn luyện</span>
            <span className="text-lg font-bold text-blue-600">{drlScore}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Xếp loại</span>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              ranking === "Xuất sắc" ? "bg-green-100 text-green-800" :
              ranking === "Giỏi" ? "bg-blue-100 text-blue-800" :
              ranking === "Khá" ? "bg-yellow-100 text-yellow-800" :
              "bg-red-100 text-red-800"
            }`}>
              {ranking}
            </span>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      onTabChange(item.id);
                      if (window.innerWidth < 1024) setIsSidebarOpen(false);
                    }}
                    className={`
                      flex items-center gap-3 w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors
                      ${isActive 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                  >
                    <Icon size={18} className={isActive ? 'text-blue-600' : 'text-gray-500'} />
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <FaSignOutAlt size={16} />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header - Reduced height with inline navigation */}
        <header className="w-full font-sans bg-[#1169f9] shadow-md sticky top-0 z-30">
          {/* Top Bar - Minimal */}
          <div className="bg-[#1169f9] text-white">
            <div className="px-4 py-1 flex justify-between items-center">
              {/* Mobile sidebar toggle */}
              <button 
                className="lg:hidden text-white text-xl"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                <FaBars />
              </button>

              {/* Desktop brand - hidden on mobile */}
              <div className="hidden lg:block">
                <span className="text-xs text-white/80">Student Panel</span>
              </div>

              {/* Right side - Navigation and Profile inline */}
              <div className="flex items-center gap-4 flex-1 justify-end">
                {/* Navigation Menu - Inline with profile */}
                <nav className="hidden md:flex items-center gap-1">
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
                          {/* User Info Section */}
                          <div className="px-4 py-3 border-b border-gray-100">
                            <p className="text-sm font-semibold text-gray-900">{studentName}</p>
                            <p className="text-xs text-gray-500">MSSV: {studentId}</p>
                            <p className="text-xs text-gray-400 mt-1">Student</p>
                          </div>
                          
                          <button 
                            onClick={() => {
                              setIsProfileOpen(false);
                              navigate('/student/profile');
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          >
                            <FaUserCircle size={14} />
                            My Profile
                          </button>
                          
                          <button 
                            onClick={() => {
                              setIsProfileOpen(false);
                              navigate('/student/settings');
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          >
                            <FaCog size={14} />
                            Settings
                          </button>
                          
                          <button 
                            onClick={() => {
                              setIsProfileOpen(false);
                              handleLogout();
                            }}
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
        </header>

        {/* Content Area - Children will be rendered here */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default StudentHeader;