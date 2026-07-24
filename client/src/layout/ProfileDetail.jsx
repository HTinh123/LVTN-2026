// client/src/layout/ProfileDetail.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaUser, 
  FaEnvelope, 
  FaIdCard, 
  FaKey, 
  FaSave, 
  FaEdit, 
  FaGraduationCap,
  FaBuilding,
  FaCalendarAlt,
  FaUserTag,
  FaUserCog,
  FaSchool
} from 'react-icons/fa';
import { toast } from 'react-toastify';

const BASE_URL =  'http://localhost:5000';

function ProfileDetail() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  
  // State for editing profile
  const [editData, setEditData] = useState({
    hoten: '',
    username: ''
  });
  
  // State for password change
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Get user from localStorage
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
        setEditData({
          hoten: userData.hoten || '',
          username: userData.username || ''
        });
      } catch (err) {
        console.error('Error parsing user data:', err);
        setError('Invalid user data');
        navigate('/login');
      }
    } else {
      setError('No user logged in');
      navigate('/login');
    }
  }, [navigate]);

  // Fetch profile data based on role
  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        };

        let url = '';
        const role = user.role;

        if (role === 'student') {
          const mssv = user.mssv || user.id;
          if (!mssv) throw new Error('Student ID not found');
          url = `${BASE_URL}/api/staff/students/${mssv}`;
        } else if (role === 'staff') {
          const msnv = user.msnv || user.id;
          if (!msnv) throw new Error('Staff ID not found');
          url = `${BASE_URL}/api/admin/staff/${msnv}`;
        } else if (role === 'admin') {
          const msnv = user.msnv || user.id;
          if (!msnv) throw new Error('Admin ID not found');
          url = `${BASE_URL}/api/admin/admin/${msnv}`;
        } else if (role === 'cvht') {
          const ms_cvht = user.ms_cvht || user.id;
          if (!ms_cvht) throw new Error('CVHT ID not found');
          url = `${BASE_URL}/api/staff/cvht/${ms_cvht}`;
        } else {
          throw new Error('Unknown user role');
        }

        const res = await fetch(url, { headers });
        const data = await res.json();
        
        if (data.success) {
          setProfile(data.data);
          setEditData({
            hoten: data.data.hoten || '',
            username: data.data.username || ''
          });
        } else {
          // Fallback to localStorage data
          setProfile({
            hoten: user.hoten || '',
            username: user.username || '',
            mssv: user.mssv || user.id || '',
            msnv: user.msnv || user.id || '',
            ms_cvht: user.ms_cvht || user.id || '',
            role: user.role === 'admin' ? 1 : 0
          });
        }
      } catch (err) {
        setError(err.message || 'An error occurred');
        console.error('Fetch profile error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  // Helper: Generate student email
  const generateStudentEmail = (mssv) => {
    if (!mssv) return '';
    const clean = mssv.trim().toLowerCase();
    return `${clean}@student.stu.edu.vn`;
  };

  // Helper: Extract start year from MSSV
  const getStartYearFromMssv = (mssv) => {
    if (!/^DH5\d{2}/.test(mssv)) {
      return null;
    }
    const yearStr = mssv.substring(3, 5);
    return 2000 + parseInt(yearStr, 10);
  };

  // Helper: Get student status
  const getStudentStatus = (validUntil) => {
    if (!validUntil) return 'Đang học';
    const today = new Date();
    const validDate = new Date(validUntil);
    return today <= validDate ? 'Đang học' : 'Đã tốt nghiệp';
  };

  // Handle edit profile submission
  const handleEditProfile = async (e) => {
    e.preventDefault();
    
    if (!editData.hoten.trim() && !editData.username.trim()) {
      toast.error('Vui lòng nhập ít nhất một trường');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const role = user.role;
      let userId, url;

      if (role === 'staff' || role === 'admin') {
        userId = profile?.msnv || user.msnv || user.id;
        url = `${BASE_URL}/api/auth/staff/${userId}/profile`;
      } else if (role === 'cvht') {
        userId = profile?.ms_cvht || user.ms_cvht || user.id;
        url = `${BASE_URL}/api/auth/cvht/${userId}/profile`;
      } else {
        throw new Error('Role not supported for profile editing');
      }

      const body = {};
      if (editData.hoten.trim()) body.hoten = editData.hoten.trim();
      if (editData.username.trim()) body.username = editData.username.trim();

      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (data.success) {
        localStorage.setItem('token', data.data.token);
        const updatedUser = { ...user, hoten: data.data.user.hoten, username: data.data.user.username };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setProfile(prev => ({ ...prev, ...data.data.user }));
        toast.success('Cập nhật hồ sơ thành công!');
        setIsEditing(false);
      } else {
        toast.error(data.error || 'Cập nhật thất bại');
      }
    } catch (err) {
      toast.error('Có lỗi xảy ra, vui lòng thử lại');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle change password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Mật khẩu mới không khớp');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const role = user.role;
      let userId, url;

      if (role === 'student') {
        userId = profile?.mssv || user.mssv || user.id;
        url = `${BASE_URL}/api/auth/student/${userId}/change-password`;
      } else if (role === 'staff' || role === 'admin') {
        userId = profile?.msnv || user.msnv || user.id;
        url = `${BASE_URL}/api/auth/staff/${userId}/change-password`;
      } else if (role === 'cvht') {
        userId = profile?.ms_cvht || user.ms_cvht || user.id;
        url = `${BASE_URL}/api/auth/cvht/${userId}/change-password`;
      } else {
        throw new Error('Unknown role');
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Đổi mật khẩu thành công!');
        setShowPasswordForm(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        toast.error(data.error || 'Đổi mật khẩu thất bại');
      }
    } catch (err) {
      toast.error('Có lỗi xảy ra, vui lòng thử lại');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !profile) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 max-w-4xl mx-auto mt-8">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
            <button onClick={() => window.location.reload()} className="mt-1 text-sm text-red-600 hover:text-red-800">
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const role = user?.role;
  const isStaffOrAdmin = role === 'staff' || role === 'admin';
  const isCvht = role === 'cvht';
  const isStudent = role === 'student';

  // Student-specific data
  const studentMssv = profile.mssv || user?.mssv;
  const studentEmail = isStudent ? generateStudentEmail(studentMssv) : '';
  const startYear = isStudent ? getStartYearFromMssv(studentMssv) : null;
  const courseRange = startYear ? `${startYear} - ${startYear + 4}` : '';
  const studentStatus = isStudent ? getStudentStatus(profile.valid_until) : '';

  // Get role label
  const getRoleLabel = () => {
    if (isStudent) return 'Sinh viên';
    if (isCvht) return 'Cố vấn học tập';
    if (role === 'admin') return 'Quản trị viên';
    if (role === 'staff') return 'Nhân viên';
    return 'Người dùng';
  };

  // Get ID label and value
  const getIdInfo = () => {
    if (isStudent) return { label: 'MSSV', value: profile.mssv || user?.mssv || '—' };
    if (isCvht) return { label: 'Mã CVHT', value: profile.ms_cvht || user?.ms_cvht || '—' };
    return { label: 'Mã nhân viên', value: profile.msnv || user?.msnv || '—' };
  };

  const idInfo = getIdInfo();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Thông tin tài khoản</h1>
        <p className="text-gray-600 mt-1">Quản lý thông tin cá nhân và mật khẩu của bạn</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
            <div className="text-center mb-6">
              <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-3 ${
                isStudent ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
                isCvht ? 'bg-gradient-to-r from-purple-400 to-purple-600' :
                'bg-gradient-to-r from-green-400 to-green-600'
              }`}>
                <FaUser className="text-white text-4xl" />
              </div>
              <h3 className="font-semibold text-gray-900">{profile.hoten || user?.hoten || 'Người dùng'}</h3>
              <p className="text-sm text-gray-500 mt-1">{getRoleLabel()}</p>
            </div>
            
            <div className="space-y-2">
              <button
                onClick={() => {
                  setIsEditing(!isEditing);
                  setShowPasswordForm(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                  !showPasswordForm && !isEditing ? 'bg-blue-50 text-blue-600' : 
                  isEditing ? 'bg-orange-50 text-orange-600' :
                  'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <FaUser size={16} />
                <span>Thông tin cá nhân</span>
                {isEditing && <span className="ml-auto text-xs text-orange-600">(Đang chỉnh sửa)</span>}
              </button>
              <button
                onClick={() => {
                  setShowPasswordForm(!showPasswordForm);
                  setIsEditing(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                  showPasswordForm ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <FaKey size={16} />
                <span>Đổi mật khẩu</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Profile Info Form */}
          {!showPasswordForm && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Thông tin cá nhân</h2>
                {!isEditing && (isStaffOrAdmin || isCvht) && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 text-blue-500 hover:text-blue-600 transition"
                  >
                    <FaEdit size={14} />
                    <span className="text-sm">Chỉnh sửa</span>
                  </button>
                )}
              </div>

              <form onSubmit={handleEditProfile}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <FaIdCard className="inline mr-2 text-gray-400" size={14} />
                      {idInfo.label}
                    </label>
                    <input
                      type="text"
                      value={idInfo.value}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <FaUser className="inline mr-2 text-gray-400" size={14} />
                      Họ và tên
                    </label>
                    <input
                      type="text"
                      value={editData.hoten}
                      onChange={(e) => setEditData({ ...editData, hoten: e.target.value })}
                      disabled={!isEditing}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <FaUserTag className="inline mr-2 text-gray-400" size={14} />
                      Tên đăng nhập
                    </label>
                    <input
                      type="text"
                      value={editData.username}
                      onChange={(e) => setEditData({ ...editData, username: e.target.value })}
                      disabled={!isEditing}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                    />
                  </div>

                  {isStudent && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          <FaEnvelope className="inline mr-2 text-gray-400" size={14} />
                          Email
                        </label>
                        <input
                          type="email"
                          value={studentEmail}
                          disabled
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            <FaSchool className="inline mr-2 text-gray-400" size={14} />
                            Lớp hiện tại
                          </label>
                          <input
                            type="text"
                            value={profile.current_class || '—'}
                            disabled
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            <FaBuilding className="inline mr-2 text-gray-400" size={14} />
                            Khoa
                          </label>
                          <input
                            type="text"
                            value={profile.department_name || '—'}
                            disabled
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            <FaCalendarAlt className="inline mr-2 text-gray-400" size={14} />
                            Khóa học
                          </label>
                          <input
                            type="text"
                            value={courseRange || '—'}
                            disabled
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            <FaUserCog className="inline mr-2 text-gray-400" size={14} />
                            Trạng thái
                          </label>
                          <div className={`px-3 py-2 rounded-lg text-center font-semibold ${
                            studentStatus === 'Đang học' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {studentStatus}
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {isStaffOrAdmin && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <FaUserCog className="inline mr-2 text-gray-400" size={14} />
                        Vai trò
                      </label>
                      <input
                        type="text"
                        value={profile.role === 1 ? 'Quản trị viên' : 'Nhân viên'}
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                      />
                    </div>
                  )}

                  {isCvht && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <FaGraduationCap className="inline mr-2 text-gray-400" size={14} />
                        Vai trò
                      </label>
                      <input
                        type="text"
                        value="Cố vấn học tập"
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                      />
                    </div>
                  )}

                  {isEditing && (isStaffOrAdmin || isCvht) && (
                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
                      >
                        <FaSave size={14} />
                        {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(false);
                          setEditData({
                            hoten: profile.hoten || user?.hoten || '',
                            username: profile.username || user?.username || ''
                          });
                        }}
                        className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                      >
                        Hủy
                      </button>
                    </div>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* Change Password Form */}
          {showPasswordForm && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Đổi mật khẩu</h2>

              <form onSubmit={handleChangePassword}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mật khẩu hiện tại
                    </label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mật khẩu mới
                    </label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Mật khẩu phải có ít nhất 6 ký tự</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Xác nhận mật khẩu mới
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                      <p className="text-xs text-red-500 mt-1">Mật khẩu không khớp</p>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
                    >
                      {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordForm(false);
                        setPasswordData({
                          currentPassword: '',
                          newPassword: '',
                          confirmPassword: ''
                        });
                      }}
                      className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfileDetail;