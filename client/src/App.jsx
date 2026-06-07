import { useState } from 'react';
import backgroundImage from './assets/background.jpg'; 
import logoImage from './assets/Logo.png';
  
function App() {
  const [activeRole, setActiveRole] = useState('Sinh viên');

  const roles = ['Sinh viên', 'Cố vấn học tập', 'Nhân viên', 'Quản trị viên'];

  return (
    <div 
      className="min-h-screen w-full bg-cover bg-center bg-no-repeat flex items-center justify-center p-4"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 md:p-10">
        
       
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
           
           <div className="flex justify-center mb-8">
            <img
              src={logoImage}
              alt="Logo"
              className="h-24 w-auto object-contain"
            />
          </div>
          </div>
        </div>
       
        <h1 className="text-[20px] md:text-[28px] font-black text-[#2563eb] tracking-tighter leading-none hover:opacity-80 transition-opacity text-center mb-8">
          Hệ thống quản lý điểm rèn luyện STU
        </h1>
      
        <div className="flex flex-wrap gap-1 mb-8 bg-gray-100 p-1 rounded-lg">
          {roles.map((role) => (
            <button
              key={role}
              onClick={() => setActiveRole(role)}
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
      
        <form className="space-y-5">          
          <div>           
            <input
              type="text"
              placeholder="Nhập tên đăng nhập/Email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none transition-all"
            />
          </div>
        
          <div>
            
            <input
              type="password"
              placeholder="Nhập mật khẩu"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none transition-all"
            />
          </div>
   
          <button
            type="submit"
            className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold py-2.5 rounded-lg transition-colors duration-200 mt-6"
          >
            Đăng nhập
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

export default App;