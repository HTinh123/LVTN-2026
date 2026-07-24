import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaCalendarAlt, 
  FaClock, 
  FaStar, 
  FaChevronDown, 
  FaChevronUp,
  FaBullhorn,
  FaRunning,
  FaCalendarCheck,
  FaHourglassHalf,
  FaCalendarTimes,
  FaImage,
  FaStickyNote
} from 'react-icons/fa';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function ThongBao() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('activities'); // 'notifications' or 'activities'
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [studentKhoa, setStudentKhoa] = useState([]);

  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState({
    active: true,
    upcoming: true,
    ended: false
  });

 useEffect(() => {
  const userStr = localStorage.getItem('user');
  const token = localStorage.getItem('token');
  
  if (!token) {
    setError('Please login first');
    navigate('/login');
    return;
  }
  
  if (userStr) {
    try {
      const userData = JSON.parse(userStr);
      console.log('User data:', userData);
      setUser(userData);
      
      // Check for both mssv and id fields
      const studentId = userData.mssv || userData.id;
      
      if (studentId) {
        console.log('Fetching khoa for student ID:', studentId);
        fetchStudentKhoa(studentId);
      } else {
        console.error('No student ID in user data');
        setError('Student ID not found in user data');
        setLoading(false);
      }
    } catch (err) {
      console.error('Error parsing user data:', err);
      setError('Invalid user data');
      setLoading(false);
    }
  } else {
    setError('No user logged in');
    navigate('/login');
  }
}, [navigate]);

 const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    // If no token, redirect to login
    navigate('/login');
    return {};
  }
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

 // Fetch student's departments
const fetchStudentKhoa = async (studentId) => {
  if (!studentId) {
    setError('No student ID found');
    setLoading(false);
    return;
  }
  
  try {
    console.log('Fetching khoa for student ID:', studentId);
    
    const res = await fetch(`${BASE_URL}/api/student/khoa/${studentId}`, {
      headers: getAuthHeaders()
    });
    
    console.log('Response status:', res.status);
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const responseData = await res.json();
    console.log('Response data:', responseData);
    
    if (responseData.success) {
      if (responseData.data && responseData.data.length > 0) {
        const khoaIds = responseData.data.map(k => k.ms_khoa);
        console.log('Khoa IDs:', khoaIds);
        setStudentKhoa(khoaIds);
        fetchActivities(khoaIds);
      } else {
        console.log('No department data in response');
        setStudentKhoa([]);
        setActivities([]);
        setLoading(false);
        setError('No department found for your account');
      }
    } else {
      console.log('Response not successful:', responseData);
      setStudentKhoa([]);
      setActivities([]);
      setLoading(false);
      setError(responseData.error || 'Failed to fetch department information');
    }
  } catch (err) {
    console.error('Error fetching student khoa:', err);
    setStudentKhoa([]);
    setActivities([]);
    setLoading(false);
    setError('Failed to fetch department information: ' + err.message);
  }
};

  // Fetch activities for student's departments
  const fetchActivities = async (khoaIds) => {
    setLoading(true);
    setError('');
    
    try {
      // Fetch activities for all student departments
      const allActivities = [];
      
      for (const khoaId of khoaIds) {
        const res = await fetch(`${BASE_URL}/api/staff/hoat-dong/khoa/${khoaId}`, {
          headers: getAuthHeaders()
        });
        const data = await res.json();
        
        if (data.success && data.data?.activities) {
          // Filter out duplicates by mshd
          data.data.activities.forEach(activity => {
            if (!allActivities.find(a => a.mshd === activity.mshd)) {
              allActivities.push(activity);
            }
          });
        }
      }
      
      setActivities(allActivities);
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError('Failed to fetch activities');
    } finally {
      setLoading(false);
    }
  };

  // Categorize activities
  const categorizeActivities = (activities) => {
    const now = new Date();
    
    const active = activities.filter(activity => {
      const start = new Date(activity.thoi_gian_bat_dau);
      const end = new Date(activity.thoi_gian_ket_thuc);
      return start <= now && end >= now;
    });

    const upcoming = activities.filter(activity => {
      const start = new Date(activity.thoi_gian_bat_dau);
      return start > now;
    });

    const ended = activities.filter(activity => {
      const end = new Date(activity.thoi_gian_ket_thuc);
      return end < now;
    });

    // Sort each category by date
    active.sort((a, b) => new Date(a.thoi_gian_ket_thuc) - new Date(b.thoi_gian_ket_thuc));
    upcoming.sort((a, b) => new Date(a.thoi_gian_bat_dau) - new Date(b.thoi_gian_bat_dau));
    ended.sort((a, b) => new Date(b.thoi_gian_ket_thuc) - new Date(a.thoi_gian_ket_thuc));

    return { active, upcoming, ended };
  };

  const { active, upcoming, ended } = categorizeActivities(activities);

  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Toggle section collapse
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Activity Card Component
  const ActivityCard = ({ activity }) => {
    const startDate = new Date(activity.thoi_gian_bat_dau);
    const endDate = new Date(activity.thoi_gian_ket_thuc);
    const duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const now = new Date();
    
    // Determine status
    let statusColor = 'bg-gray-100 text-gray-800';
    let statusText = 'Đã kết thúc';
    let statusIcon = FaCalendarTimes;
    
    if (startDate <= now && endDate >= now) {
      statusColor = 'bg-green-100 text-green-800';
      statusText = 'Đang diễn ra';
      statusIcon = FaRunning;
    } else if (startDate > now) {
      statusColor = 'bg-blue-100 text-blue-800';
      statusText = 'Sắp diễn ra';
      statusIcon = FaHourglassHalf;
    }

    const StatusIcon = statusIcon;

    return (
      <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100">
        <div className="flex flex-col sm:flex-row">
          {/* Image Section */}
          <div className="sm:w-48 h-48 sm:h-auto relative bg-gray-100 flex-shrink-0">
            {activity.img ? (
              <img
                src={`${BASE_URL}/uploads/${activity.img}`}
                alt={activity.ten}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = `
                    <div class="flex items-center justify-center h-full">
                      <svg class="w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  `;
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <FaImage className="w-16 h-16 text-gray-300" />
              </div>
            )}
            {/* Status Badge Overlay */}
            <div className="absolute top-2 right-2">
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${statusColor}`}>
                <StatusIcon className="w-3 h-3" />
                {statusText}
              </span>
            </div>
          </div>

          {/* Content Section */}
          <div className="flex-1 p-5">
            <div className="flex flex-col h-full justify-between">
              <div>
                {/* Title */}
                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                  {activity.ten}
                </h3>

                {/* Time Info */}
                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FaCalendarAlt className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <span>{formatDate(activity.thoi_gian_bat_dau)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FaClock className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <span>
                      {formatTime(activity.thoi_gian_bat_dau)} - {formatTime(activity.thoi_gian_ket_thuc)}
                      {duration > 1 && (
                        <span className="text-gray-400 ml-1">({duration} ngày)</span>
                      )}
                    </span>
                  </div>
                  {activity.nhanvien_name && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <FaCalendarCheck className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span>Tổ chức bởi: {activity.nhanvien_name}</span>
                    </div>
                  )}
                </div>

                {/* Points and Departments */}
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  {/* Points Badge */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 rounded-lg border border-yellow-200">
                    <FaStar className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-semibold text-yellow-700">
                      {activity.diem} điểm
                    </span>
                  </div>

                  {/* Department Badges */}
                  {activity.departments && activity.departments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {activity.departments.map((dept) => (
                        <span
                          key={dept.ms_khoa}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                        >
                          {dept.ten_khoa}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Note */}
                {activity.ghi_chu && (
                  <div className="flex items-start gap-2 text-sm text-gray-500 bg-gray-50 rounded-lg p-2.5">
                    <FaStickyNote className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <p className="line-clamp-2">{activity.ghi_chu}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Section Component
  const Section = ({ title, icon: Icon, activities, sectionKey, count }) => {
    const isExpanded = expandedSections[sectionKey];
    
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Section Header */}
        <button
          onClick={() => toggleSection(sectionKey)}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50">
              <Icon className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
              {count}
            </span>
          </div>
          {isExpanded ? (
            <FaChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <FaChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {/* Section Content */}
        {isExpanded && (
          <div className="p-4 border-t border-gray-100">
            {count === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Icon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Không có hoạt động nào</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {activities.map(activity => (
                  <ActivityCard key={activity.mshd} activity={activity} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-full bg-gray-50">
      {/* Left Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex-shrink-0">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <FaBullhorn className="w-5 h-5 text-blue-600" />
            Thông Báo
          </h2>
        </div>
        
        {/* Navigation Links */}
        <nav className="p-3 space-y-1">
          <button
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'notifications'
                ? 'bg-blue-50 text-blue-700 shadow-sm'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <FaBullhorn className={`w-4 h-4 ${activeTab === 'notifications' ? 'text-blue-600' : 'text-gray-400'}`} />
            Thông báo
          </button>
          
          <button
            onClick={() => setActiveTab('activities')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'activities'
                ? 'bg-blue-50 text-blue-700 shadow-sm'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <FaRunning className={`w-4 h-4 ${activeTab === 'activities' ? 'text-blue-600' : 'text-gray-400'}`} />
            Hoạt động
          </button>
        </nav>

        {/* User Info in Sidebar */}
        {user && (
          <div className="absolute bottom-0 left-0 w-64 p-4 border-t border-gray-200 bg-white">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user.hoten?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.hoten || user.username}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user.mssv || 'Student'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {activeTab === 'notifications' ? 'Thông Báo' : 'Hoạt Động'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {activeTab === 'notifications' 
                ? 'Cập nhật thông báo mới nhất' 
                : 'Các hoạt động rèn luyện dành cho bạn'}
            </p>
          </div>

          {/* Content based on active tab */}
          {activeTab === 'notifications' ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <FaBullhorn className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                Chưa có thông báo
              </h3>
              <p className="text-sm text-gray-400">
                Hiện tại không có thông báo nào. Vui lòng quay lại sau.
              </p>
            </div>
          ) : (
            <>
              {/* Loading State */}
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                        <div className="flex-1">
                          <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                /* Error State */
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaBullhorn className="w-8 h-8 text-red-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-600 mb-2">
                    Lỗi tải dữ liệu
                  </h3>
                  <p className="text-sm text-gray-400 mb-4">{error}</p>
                  <button
                    onClick={() => fetchStudentKhoa(user?.mssv)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Thử lại
                  </button>
                </div>
              ) : activities.length === 0 ? (
                /* Empty State */
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                  <FaRunning className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">
                    Không có hoạt động
                  </h3>
                  <p className="text-sm text-gray-400">
                    Hiện tại không có hoạt động nào cho khoa của bạn.
                  </p>
                </div>
              ) : (
                /* Activities Sections */
                <div className="space-y-6">
                  <Section
                    title="Đang diễn ra"
                    icon={FaRunning}
                    activities={active}
                    sectionKey="active"
                    count={active.length}
                  />

                  <Section
                    title="Sắp diễn ra"
                    icon={FaHourglassHalf}
                    activities={upcoming}
                    sectionKey="upcoming"
                    count={upcoming.length}
                  />

                  <Section
                    title="Đã kết thúc"
                    icon={FaCalendarTimes}
                    activities={ended}
                    sectionKey="ended"
                    count={ended.length}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ThongBao;