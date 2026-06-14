import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import RootRedirect from './components/RootRedirect';
import Login from './Login';

import AdminApp from './admin/AdminApp';
import StudentApp from './student/StudentApp';
import StaffApp from './staff/StaffApp';
import CvhtApp from './advisor/AdvisorApp';

function App() {
  return (
    <Router>
      <Routes>
     
        <Route path="/login" element={<Login />} />
        
     
        <Route path="/" element={<RootRedirect />} />
        
    
        <Route 
          path="/student/*" 
          element={
            <ProtectedRoute requiredRole="student">
              <StudentApp />
            </ProtectedRoute>
          } 
        />
        
    
        <Route 
          path="/cvht/*" 
          element={
            <ProtectedRoute requiredRole="cvht">
              <CvhtApp />
            </ProtectedRoute>
          } 
        />
        
   
        <Route 
          path="/staff/*" 
          element={
            <ProtectedRoute requiredRole="staff">
              <StaffApp />
            </ProtectedRoute>
          } 
        />
        
       
        <Route 
          path="/admin/*" 
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminApp />
            </ProtectedRoute>
          } 
        />
        
     
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;