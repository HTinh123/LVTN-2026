import { Navigate } from 'react-router-dom';

const RootRedirect = () => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (!token) {
    
    return <Navigate to="/login" replace />;
  }
  
  
  const userRole = user.role;
  
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
};

export default RootRedirect;