import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, requiredRole }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
 
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  
  if (requiredRole) {
    const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    
    
    const roleMapping = {
      'Sinh viên': 'student',
      'Cố vấn học tập': 'cvht',
      'Nhân viên': 'staff',
      'Quản trị viên': 'admin'
    };
    
    const userRole = user.role || roleMapping[user.role_vn] || user.role;
    
    if (!requiredRoles.includes(userRole)) {
      
      switch(userRole) {
        case 'student':
          return <Navigate to="/student" replace />;
        case 'cvht':
          return <Navigate to="/cvht" replace />;
        case 'staff':
          return <Navigate to="/staff" replace />;
        case 'admin':
          return <Navigate to="/admin" replace />;
        default:
          return <Navigate to="/login" replace />;
      }
    }
  }
  
  return children;
};

export default ProtectedRoute;