import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';


const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function StudentList() {
  const navigate = useNavigate();
  
  // State for dropdowns
  const [isClassesLoaded, setIsClassesLoaded] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  
  // State for semesters
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState('');
  
  // State for students and search
  const [allStudents, setAllStudents] = useState([]);
  const [displayedStudents, setDisplayedStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('');
  const [modalClasses, setModalClasses] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Add student form
  const [formData, setFormData] = useState({
    mssv: '',
    hoten: '',
    ms_khoa: '',
    lop: '',
    valid_until: ''
  });
  
  // File upload
  const fileInputRef = useRef(null);
  const [uploadFile, setUploadFile] = useState(null);
  
  // Toast
  const [toast, setToast] = useState({ message: '', type: '' });

  // Helper to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  // Load departments and semesters on mount
  useEffect(() => {
    fetchDepartments();
    fetchSemesters();
  }, []);

  // Load students when semester changes
  useEffect(() => {
    if (selectedSemester) {
      fetchAllStudents(selectedSemester);
    }
  }, [selectedSemester]);

  // Filter students when department, class, or search changes
  useEffect(() => {
    if (!selectedDepartment || isClassesLoaded) {
      filterStudents();
    }
  }, [allStudents, selectedDepartment, selectedClass, searchTerm, isClassesLoaded]);

  // Load classes when department changes
  useEffect(() => {
    if (selectedDepartment) {
      fetchClassesByDepartment(selectedDepartment);
    } else {
      setClasses([]);
      setSelectedClass('');
    }
  }, [selectedDepartment]);

  // Fetch all departments
  const fetchDepartments = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/staff/departments`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setDepartments(data.data || []);
      } else {
        setError('Failed to load departments');
      }
    } catch (err) {
      setError('Error loading departments');
      console.error(err);
    }
  };

  // Fetch all semesters and set current as default
  const fetchSemesters = async () => {
    try {
      // Fetch all semesters
      const res = await fetch(`${BASE_URL}/api/staff/semesters`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setSemesters(data.data || []);
      }
      
      // Fetch current semester
      const currentRes = await fetch(`${BASE_URL}/api/staff/semesters/current`, {
        headers: getAuthHeaders()
      });
      const currentData = await currentRes.json();
      if (currentData.success && currentData.data) {
        setSelectedSemester(currentData.data.ms_hocky);
      } else if (data.success && data.data.length > 0) {
        // Fallback: use the first semester if no current
        setSelectedSemester(data.data[0].ms_hocky);
      }
    } catch (err) {
      setError('Error loading semesters');
      console.error(err);
    }
  };

  // Fetch all students for a given semester
  const fetchAllStudents = async (semesterId) => {
    if (!semesterId) return;
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/staff/students?ms_hocky=${semesterId}`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setAllStudents(data.data || []);
      } else {
        setAllStudents([]);
        setError(data.error || 'Failed to fetch students');
      }
    } catch (err) {
      setAllStudents([]);
      setError('Error loading students');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

 // Filter students based on department, class, and search
const filterStudents = () => {
  let filtered = [...allStudents];

  // Filter by department - only if classes are loaded
  if (selectedDepartment && isClassesLoaded) {
    // Get all class codes for this department
    const departmentClassCodes = classes.map(c => c.mslop);
    
    if (departmentClassCodes.length > 0) {
      filtered = filtered.filter(student => {
        // Use current_class or lop - whichever is available
        const studentClass = student.current_class || student.lop;
        return departmentClassCodes.includes(studentClass);
      });
    } else {
      filtered = [];
    }
  }

  // Filter by class
  if (selectedClass) {
    filtered = filtered.filter(student => {
      const studentClass = student.current_class || student.lop;
      return studentClass === selectedClass;
    });
  }

  // Filter by search term
  if (searchTerm.trim()) {
    const term = searchTerm.trim().toLowerCase();
    filtered = filtered.filter(student =>
      student.mssv?.toLowerCase().includes(term) ||
      student.hoten?.toLowerCase().includes(term) ||
      student.username?.toLowerCase().includes(term) ||
      (student.current_class || student.lop)?.toLowerCase().includes(term)
    );
  }

  setDisplayedStudents(filtered);
};

  // Fetch classes by department
  const fetchClassesByDepartment = async (ms_khoa) => {
    setIsClassesLoaded(false);
    try {
      const res = await fetch(`${BASE_URL}/api/staff/departments/${ms_khoa}/classes`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setClasses(data.data || []);
        setSelectedClass('');
        setIsClassesLoaded(true);
      } else {
        setClasses([]);
        setIsClassesLoaded(true);
      }
    } catch (err) {
      setClasses([]);
      setIsClassesLoaded(true);
      console.error(err);
    }
  };

  // Fetch classes for modal dropdown
  const fetchClassesForModal = async (ms_khoa) => {
    try {
      const res = await fetch(`${BASE_URL}/api/staff/departments/${ms_khoa}/classes`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setModalClasses(data.data || []);
      } else {
        setModalClasses([]);
      }
    } catch (err) {
      setModalClasses([]);
      console.error(err);
    }
  };

  // Handle department change
  const handleDepartmentChange = (e) => {
    const value = e.target.value;
    setSelectedDepartment(value);
    setSelectedClass('');
    setIsClassesLoaded(false);
    if (!value) {
      setIsClassesLoaded(true);
      setDisplayedStudents(allStudents);
    }
  };

  // Handle class change
  const handleClassChange = (e) => {
    setSelectedClass(e.target.value);
  };

  // Handle modal department change
  const handleModalDepartmentChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      ms_khoa: value,
      lop: ''
    }));

    if (value) {
      fetchClassesForModal(value);
    } else {
      setModalClasses([]);
    }
  };

  // Handle semester change
  const handleSemesterChange = (e) => {
    setSelectedSemester(e.target.value);
    // Reset department and class filters when semester changes
    setSelectedDepartment('');
    setSelectedClass('');
    setSearchTerm('');
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      filterStudents();
    }
  };

  // Reset password
  const handleResetPassword = (student) => {
    setModalMode('reset');
    setSelectedStudent(student);
    setShowModal(true);
  };

  // Delete student
  const handleDeleteStudent = (student) => {
    setModalMode('delete');
    setSelectedStudent(student);
    setShowModal(true);
  };

  // Show toast
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 4000);
  };

  // Confirm action
  const confirmAction = async () => {
    setLoading(true);
    setError('');

    try {
      let url = '';
      let method = 'POST';
      let body = null;

      switch (modalMode) {
        case 'reset':
          url = `${BASE_URL}/api/auth/students/${selectedStudent.mssv}/reset-password`;
          method = 'POST';
          break;

        case 'delete':
          url = `${BASE_URL}/api/staff/students/${selectedStudent.mssv}`;
          method = 'DELETE';
          break;

        case 'add':
          url = `${BASE_URL}/api/auth/student/register`;
          method = 'POST';
          body = JSON.stringify({
            mssv: formData.mssv,
            hoten: formData.hoten,
            mslop: formData.lop,
          });
          break;

        case 'bulk':
          if (!uploadFile) {
            setError('Please select a file');
            setLoading(false);
            return;
          }
          const formDataFile = new FormData();
          formDataFile.append('file', uploadFile);
          const res = await fetch(`${BASE_URL}/api/auth/student/bulk-upload`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formDataFile
          });
          const data = await res.json();
          if (data.success) {
            showToast(`Bulk import completed: ${data.data?.success || 0} students added`);
            if (selectedSemester) fetchAllStudents(selectedSemester);
            setShowModal(false);
            setUploadFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
          } else {
            setError(data.error || 'Bulk import failed');
          }
          setLoading(false);
          return;

        default:
          throw new Error('Invalid action');
      }

      const res = await fetch(url, {
        method: method,
        headers: getAuthHeaders(),
        body: body
      });

      const data = await res.json();

      if (data.success) {
        if (modalMode === 'reset') {
          showToast(`Password reset successful! New password: ${data.data?.newPassword || 'check your email'}`, 'success');
        } else if (modalMode === 'delete') {
          showToast(`Student ${selectedStudent.hoten} deleted successfully`, 'success');
          if (selectedSemester) fetchAllStudents(selectedSemester);
        } else if (modalMode === 'add') {
          showToast(`Student ${formData.hoten} added successfully. Username: ${data.data?.user?.username}, Password: ${data.data?.user?.password}`, 'success');
          if (selectedSemester) fetchAllStudents(selectedSemester);
        }
        setShowModal(false);
        if (modalMode === 'add') {
          setFormData({ 
            mssv: '', 
            hoten: '', 
            ms_khoa: '', 
            lop: '', 
            valid_until: '' 
          });
          setModalClasses([]);
        }
      } else {
        setError(data.error || 'Operation failed');
      }
    } catch (err) {
      setError('Operation failed. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
// Navigate to student details (DiemRenLuyen)
const goToDetails = (mssv) => {
  // Navigate to the student's DRL page with the student ID as parameter
  navigate(`/staff/drl/${mssv}`);
};

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // Render toast
  const renderToast = () => {
    if (!toast.message) return null;
    return (
      <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
        toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
      }`}>
        {toast.message}
      </div>
    );
  };

  return (
    
      <div className="space-y-6">
        {renderToast()}

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-red-700">{error}</p>
              <button onClick={() => setError('')} className="text-red-600 hover:text-red-800">×</button>
            </div>
          </div>
        )}

        {/* Filters and Actions */}
        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex flex-wrap gap-4 items-end">
            {/* Semester Dropdown */}
            <div className="w-full sm:w-48">
              <label className="block text-sm font-medium text-gray-700">Semester</label>
           <select
  value={selectedSemester}
  onChange={handleSemesterChange}
  className="mt-1 w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent "
>
  {semesters.length > 0 ? (
    semesters.map((sem) => {
      // Format: HK2 (2025 - 2026)
      const year = sem.nam;
      const nextYear = year + 1;
      const displayName =  `HK${sem.hocky} (${year} - ${nextYear})`;
      
      return (
        <option key={sem.ms_hocky} value={sem.ms_hocky}>
          {displayName}
        </option>
      );
    })
  ) : (
    <option value="">No semesters available</option>
  )}
</select>
            </div>

            {/* Department Dropdown */}
            <div className="w-full sm:w-48">
              <label className="block text-sm font-medium text-gray-700">Department</label>
              <select
                value={selectedDepartment}
                onChange={handleDepartmentChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="">All Departments</option>
                {departments.map(dept => (
                  <option key={dept.ms_khoa} value={dept.ms_khoa}>
                    {dept.ten_khoa}
                  </option>
                ))}
              </select>
            </div>

            {/* Classes Dropdown */}
            <div className="w-full sm:w-48">
              <label className="block text-sm font-medium text-gray-700">Class</label>
              <select
                value={selectedClass}
                onChange={handleClassChange}
                disabled={!selectedDepartment}
                className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md ${
                  !selectedDepartment ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
              >
                <option value="">All Classes</option>
                {classes.map(cls => (
                  <option key={cls.mslop} value={cls.mslop}>
                    {cls.mslop} 
                  </option>
                ))}
              </select>
            </div>

            {/* Search Bar */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700">Search</label>
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                onKeyPress={handleSearchKeyPress}
                placeholder="Search by MSSV, name, or class..."
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setModalMode('add');
                  const initialDepartment = selectedDepartment || '';
                  setFormData({ 
                    mssv: '', 
                    hoten: '', 
                    ms_khoa: initialDepartment,
                    lop: '', 
                    valid_until: '' 
                  });
                  if (initialDepartment) {
                    fetchClassesForModal(initialDepartment);
                  } else {
                    setModalClasses([]);
                  }
                  setShowModal(true);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Add Student
              </button>
              <button
                onClick={() => {
                  setModalMode('bulk');
                  setUploadFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                  setShowModal(true);
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Bulk Import
              </button>
            </div>
          </div>
        </div>

        {/* Student Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Students 
              {selectedClass && ` - ${selectedClass}`}
              {selectedDepartment && !selectedClass && ` - ${departments.find(d => d.ms_khoa === selectedDepartment)?.ten_khoa || ''}`}
              {selectedSemester && semesters.find(s => s.ms_hocky == selectedSemester) && 
                ` - ${semesters.find(s => s.ms_hocky == selectedSemester).display_name || ''}`
              }
              {loading && <span className="ml-2 text-sm text-gray-500">(Loading...)</span>}
              <span className="ml-2 text-sm text-gray-500">({displayedStudents.length} students)</span>
            </h3>
            <button
              onClick={() => {
                if (selectedSemester) fetchAllStudents(selectedSemester);
                setSearchTerm('');
                setSelectedDepartment('');
                setSelectedClass('');
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              <svg className="inline-block h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reset Filters
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MSSV</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading && displayedStudents.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : displayedStudents.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                      {allStudents.length === 0 ? 'No students found for this semester. Add a new student to get started.' : 'No students match the current filters.'}
                    </td>
                  </tr>
                ) : (
                  displayedStudents.map((student) => (
                    <tr key={student.mssv} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {student.mssv}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.hoten}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.lop || student.current_class}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => goToDetails(student.mssv)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                        >
                          Details
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          onClick={() => handleResetPassword(student)}
                          className="text-yellow-600 hover:text-yellow-900 transition-colors"
                        >
                          Reset Password
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          onClick={() => handleDeleteStudent(student)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
             
            </table>
          </div>
        </div>

        {/* Modal - unchanged */}
        {showModal && (
          <div className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>

              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${
                      modalMode === 'add' ? 'bg-blue-100' :
                      modalMode === 'bulk' ? 'bg-purple-100' :
                      modalMode === 'reset' ? 'bg-yellow-100' :
                      'bg-red-100'
                    } sm:mx-0 sm:h-10 sm:w-10`}>
                      {modalMode === 'add' && (
                        <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                      )}
                      {modalMode === 'bulk' && (
                        <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                      )}
                      {modalMode === 'reset' && (
                        <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      )}
                      {modalMode === 'delete' && (
                        <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        {modalMode === 'add' && 'Add New Student'}
                        {modalMode === 'bulk' && 'Bulk Import Students'}
                        {modalMode === 'reset' && 'Reset Password'}
                        {modalMode === 'delete' && 'Delete Student'}
                      </h3>
                      <div className="mt-2">
                        {modalMode === 'reset' && (
                          <p className="text-sm text-gray-500">
                            Are you sure you want to reset the password for <strong>{selectedStudent?.hoten}</strong> ({selectedStudent?.mssv})? 
                            A new password will be generated automatically.
                          </p>
                        )}
                        {modalMode === 'delete' && (
                          <p className="text-sm text-gray-500">
                            Are you sure you want to delete <strong>{selectedStudent?.hoten}</strong> ({selectedStudent?.mssv})? 
                            This action cannot be undone.
                          </p>
                        )}
                        {modalMode === 'add' && (
                          <div className="mt-4 space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">MSSV *</label>
                              <input
                                type="text"
                                required
                                value={formData.mssv}
                                onChange={(e) => setFormData({ ...formData, mssv: e.target.value })}
                                className="text-black mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="e.g., DH52001001"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Full Name *</label>
                              <input
                                type="text"
                                required
                                value={formData.hoten}
                                onChange={(e) => setFormData({ ...formData, hoten: e.target.value })}
                                className="text-black mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="Nguyen Van A"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700">Department *</label>
                              <select
                                required
                                value={formData.ms_khoa}
                                onChange={handleModalDepartmentChange}
                                className="text-black mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              >
                                <option value="">Select department</option>
                                {departments.map((dept) => (
                                  <option key={dept.ms_khoa} value={dept.ms_khoa}>
                                    {dept.ten_khoa}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700">Class *</label>
                              <select
                                required
                                value={formData.lop}
                                onChange={(e) => setFormData({ ...formData, lop: e.target.value })}
                                disabled={!formData.ms_khoa || modalClasses.length === 0}
                                className={`text-black mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${!formData.ms_khoa || modalClasses.length === 0 ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                              >
                                <option value="">Select class</option>
                                {modalClasses.map((cls) => (
                                  <option key={cls.mslop} value={cls.mslop}>
                                    {cls.mslop}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}
                        {modalMode === 'bulk' && (
                          <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700">Upload File (CSV, JSON, or TXT)</label>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept=".csv,.json,.txt"
                              onChange={(e) => setUploadFile(e.target.files[0])}
                              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                            <p className="mt-2 text-xs text-gray-500">
                              Supported formats: CSV (mssv,hoten,lop,valid_until), JSON array, or tab-separated TXT
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    onClick={confirmAction}
                    disabled={
                      loading ||
                      (modalMode === 'add' && (
                        !formData.mssv || 
                        !formData.hoten ||
                        !formData.lop
                      )) ||
                      (modalMode === 'bulk' && !uploadFile)
                    }
                    className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm ${
                      modalMode === 'add' ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500' :
                      modalMode === 'bulk' ? 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500' :
                      modalMode === 'reset' ? 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500' :
                      'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      'Confirm'
                    )}
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    
  );
}

export default StudentList;