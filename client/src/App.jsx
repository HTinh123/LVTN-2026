import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import RootRedirect from './components/RootRedirect';
import Login from './Login';

import AdminApp from './admin/AdminApp';
import StudentApp from './student/StudentApp';
import StaffApp from './staff/StaffApp';
import AdvisorApp from './advisor/AdvisorApp';
import DiemRenLuyen from './student/DiemRenLuyen';
import StaffDrlView from './staff/StaffDrlView';
import ProfileWrapper from './layout/ProfileWrapper';

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
          path="/staff/drl/:mssv?" 
         element={
    <ProtectedRoute requiredRole="staff">
      <StaffDrlView />
    </ProtectedRoute>
          } 
        />

 <Route 
  path="/profile" 
  element={
    <ProtectedRoute requiredRole={['student', 'staff', 'admin', 'cvht']}>
      <ProfileWrapper />
    </ProtectedRoute>
  } 
/>

        <Route 
          path="/student/drl/:mssv?" 
          element={
            <ProtectedRoute requiredRole="student">
              <DiemRenLuyen />
            </ProtectedRoute>
          } 
        />
    
         <Route 
          path="/cvht/*" 
          element={
            <ProtectedRoute requiredRole="cvht">
              <AdvisorApp />
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