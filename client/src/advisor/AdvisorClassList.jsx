import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../components/PageWrapper';

const BASE_URL =  'http://localhost:5000';

function AdvisorClassList() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [advisorInfo, setAdvisorInfo] = useState(null);
  const [currentSemester, setCurrentSemester] = useState(null);

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  // Get user info from localStorage
  const getUser = () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : {};
  };

  // Fetch semesters on mount
  useEffect(() => {
    fetchSemesters();
  }, []);

  // Fetch classes when semester changes
  useEffect(() => {
    if (selectedSemester) {
      fetchClasses();
    }
  }, [selectedSemester]);

  // Fetch all semesters and current semester
  const fetchSemesters = async () => {
    try {
      // Fetch all semesters
      const res = await fetch(`${BASE_URL}/api/staff/semesters`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setSemesters(data.data || []);
        
        // Fetch current semester
        const currentRes = await fetch(`${BASE_URL}/api/staff/semesters/current`, {
          headers: getAuthHeaders()
        });
        const currentData = await currentRes.json();
        if (currentData.success && currentData.data) {
          setCurrentSemester(currentData.data);
          setSelectedSemester(currentData.data.ms_hocky);
        } else if (data.data && data.data.length > 0) {
          // Fallback: use the first semester
          setSelectedSemester(data.data[0].ms_hocky);
        }
      } else {
        setError(data.error || 'Failed to fetch semesters');
      }
    } catch (err) {
      setError('Failed to fetch semesters');
      console.error(err);
    }
  };

  // Fetch classes for the advisor
  const fetchClasses = async () => {
    const user = getUser();
    const ms_cvht = user.id || user.ms_cvht;
    
    if (!ms_cvht) {
      setError('Advisor information not found');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch(
        `${BASE_URL}/api/advisor/cvht/${ms_cvht}/semesters/${selectedSemester}/classes`,
        {
          headers: getAuthHeaders()
        }
      );
      const data = await res.json();
      if (data.success) {
        setClasses(data.data?.classes || []);
        setAdvisorInfo(data.data?.cvht || null);
      } else {
        setError(data.error || 'Failed to fetch classes');
      }
    } catch (err) {
      setError('Failed to fetch classes. Please check your connection.');
      console.error('Fetch classes error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle semester change
  const handleSemesterChange = (e) => {
    setSelectedSemester(e.target.value);
  };

  // Handle click on class row - navigate to ClassStudentList
  const handleClassClick = (classItem) => {
    navigate(`/advisor/classes/${classItem.mslop}/students`, {
      state: { 
        classInfo: classItem,
        semester: semesters.find(s => s.ms_hocky == selectedSemester),
        advisor: advisorInfo
      }
    });
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

  // Get semester display name
  const getSemesterDisplay = (ms_hocky) => {
    const sem = semesters.find(s => s.ms_hocky == ms_hocky);
    return sem?.display_name || sem?.hocky || 'N/A';
  };

  if (loading && classes.length === 0) {
    return (
      <PageWrapper>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="space-y-6">
        {/* Success/Info message */}
        {advisorInfo && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  <strong>Advisor:</strong> {advisorInfo.hoten} ({advisorInfo.username})
                  {currentSemester && (
                    <span className="ml-4">
                      <strong>Current Semester:</strong> {currentSemester.display_name || `HK${currentSemester.hocky} - ${currentSemester.nam}`}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-red-700">{error}</p>
              <button onClick={() => setError('')} className="text-red-600 hover:text-red-800">×</button>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Total Classes</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">{classes.length}</dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Total Students</dt>
              <dd className="mt-1 text-3xl font-semibold text-blue-600">
                {classes.reduce((sum, cls) => sum + (cls.student_count || 0), 0)}
              </dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Semester</dt>
              <dd className="mt-1 text-lg font-semibold text-gray-900">
                {selectedSemester ? getSemesterDisplay(selectedSemester) : 'N/A'}
              </dd>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="w-full sm:w-64">
              <label className="block text-sm font-medium text-gray-700">Semester</label>
              <select
                value={selectedSemester}
                onChange={handleSemesterChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                {semesters.map((sem) => (
                  <option key={sem.ms_hocky} value={sem.ms_hocky}>
                    {sem.display_name || `HK${sem.hocky} - ${sem.nam}`}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={fetchClasses}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="inline-block h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Classes Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              My Classes
              {selectedSemester && semesters.find(s => s.ms_hocky == selectedSemester) && 
                ` - ${semesters.find(s => s.ms_hocky == selectedSemester).display_name || ''}`
              }
            </h3>
            <span className="text-sm text-gray-500">{classes.length} class(es)</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading && classes.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : classes.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                      No classes assigned for this semester.
                    </td>
                  </tr>
                ) : (
                  classes.map((classItem) => (
                    <tr 
                      key={classItem.mslop} 
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => handleClassClick(classItem)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {classItem.mslop}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {classItem.department_name || classItem.ms_khoa || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {classItem.student_count || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(classItem.assigned_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClassClick(classItem);
                          }}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          View Students
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* No data message for empty state */}
        {!loading && classes.length === 0 && (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No Classes Assigned</h3>
            <p className="mt-1 text-sm text-gray-500">
              You don't have any classes assigned for this semester.
            </p>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}

export default AdvisorClassList;