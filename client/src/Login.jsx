import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import backgroundImage from './assets/background.jpg'; 
import logoImage from './assets/Logo.png';

function Login() {
  const navigate = useNavigate();
  const [activeRole, setActiveRole] = useState('Sinh viên');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const roles = ['Sinh viên', 'Cố vấn học tập', 'Nhân viên', 'Quản trị viên'];

  // Map Vietnamese role names to API endpoints and role values
  const getRoleConfig = (roleName) => {
    switch(roleName) {
      case 'Sinh viên':
        return { endpoint: '/student', role: 'student', path: '/student' };
      case 'Cố vấn học tập':
        return { endpoint: '/cvht', role: 'cvht', path: '/cvht' };
      case 'Nhân viên':
        return { endpoint: '/staff', role: 'staff', path: '/staff' };
      case 'Quản trị viên':
        return { endpoint: '/admin', role: 'admin', path: '/admin' };
      default:
        return { endpoint: '/student', role: 'student', path: '/student' };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setError('');
    
    if (!username.trim()) {
      setError('Vui lòng nhập tên đăng nhập');
      return;
    }
    
    if (!password.trim()) {
      setError('Vui lòng nhập mật khẩu');
      return;
    }
    
    setLoading(true);
    
    try {
      const roleConfig = getRoleConfig(activeRole);
      const API_URL =  'http://localhost:5000';
      
      const response = await axios.post(
        `${API_URL}/api/auth/login${roleConfig.endpoint}`,
        {
          username: username.trim(),
          password: password
        }
      );
      
      if (response.data.success) {
        // Store token and user data
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify({
          ...response.data.data.user,
          role_vn: activeRole // Store Vietnamese role name for display
        }));
        
        // Redirect to the appropriate dashboard based on role
        navigate(roleConfig.path, { replace: true });
      }
    } catch (err) {
      console.error('Login error:', err);
      if (err.response) {
        setError(err.response.data.error || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
      } else if (err.request) {
        setError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
      } else {
        setError('Có lỗi xảy ra. Vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getPlaceholderText = () => {
   
        return 'Nhập tên đăng nhập';
    
  };

  return (
    <div 
      className="min-h-screen w-full bg-cover bg-center bg-no-repeat flex items-center justify-center p-4"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 md:p-10">
        
        <div className="flex justify-center mb-6">
          <div className="flex justify-center mb-8">
            <img
              src={logoImage}
              alt="Logo"
              className="h-24 w-auto object-contain"
            />
          </div>
        </div>
       
        <h1 className="text-[20px] md:text-[28px] font-black text-[#2563eb] tracking-tighter leading-none hover:opacity-80 transition-opacity text-center mb-8">
          Hệ thống quản lý điểm rèn luyện STU
        </h1>
      
        <div className="flex flex-wrap gap-1 mb-8 bg-gray-100 p-1 rounded-lg">
          {roles.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => {
                setActiveRole(role);
                setError('');
              }}
              className={`
                flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all duration-200
                ${activeRole === role 
                  ? 'bg-white text-[#2563eb] shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              {role}
            </button>
          ))}
        </div>
      
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
      
        <form onSubmit={handleSubmit} className="space-y-5">          
          <div>           
            <input
              type="text"
              placeholder={getPlaceholderText()}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none transition-all"
              disabled={loading}
            />
          </div>
        
          <div>
            <input
              type="password"
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none transition-all"
              disabled={loading}
            />
          </div>
   
          <button
            type="submit"
            disabled={loading}
            className={`
              w-full bg-[#2563eb] text-white font-semibold py-2.5 rounded-lg transition-colors duration-200 mt-6
              ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#1d4ed8]'}
            `}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-75" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang xử lý...
              </span>
            ) : (
              'Đăng nhập'
            )}
          </button>
        </form>
   
        <div className="mt-6 text-center text-sm text-gray-500">
          <a href="#" className="hover:text-[#2563eb] transition-colors">
            Quên mật khẩu?
          </a>
        </div>
      </div>
    </div>
  );
}

export default Login;