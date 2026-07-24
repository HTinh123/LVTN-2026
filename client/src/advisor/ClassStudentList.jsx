// client/src/advisor/ClassStudentList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import PageWrapper from '../components/PageWrapper';

const BASE_URL =  'http://localhost:5000';

function ClassStudentList() {
  const navigate = useNavigate();
  const location = useLocation();
  const { mslop } = useParams();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [classInfo, setClassInfo] = useState(null);
  const [semesterInfo, setSemesterInfo] = useState(null);
  const [advisorInfo, setAdvisorInfo] = useState(null);

  const state = location.state || {};

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const goToStudentDetails = (mssv) => {
  navigate(`/cvht/drl/${mssv}`);
};

  const getSemesterDisplayName = (sem) => {
    if (!sem) return 'N/A';
    if (sem.display_name) return sem.display_name;
    
    const year = sem.nam;
    let startYear = year;
    let endYear = year + 1;
    
    if (sem.hocky === '2') {
      startYear = year - 1;
      endYear = year;
    }
    
    return `HK${sem.hocky} (${startYear} - ${endYear})`;
  };

  const fetchStudents = async () => {
    // Get semester from state
    const ms_hocky = state.semester?.ms_hocky;
    
    if (!mslop) {
      setError('Class ID not found');
      setLoading(false);
      return;
    }

    if (!ms_hocky) {
      setError('Semester information not found');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const url = `${BASE_URL}/api/staff/classes/${mslop}/semesters/${ms_hocky}/students`;
     
      
      const res = await fetch(url, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      
  
      
      if (data.success) {
        setStudents(data.data || []);
        setSemesterInfo(data.semester);
        setClassInfo({ mslop: data.class });
        setAdvisorInfo(state.advisor || null);
        setError(''); // Clear any previous error
      } else {
        setError(data.error || 'Failed to fetch students');
        setStudents([]);
      }
    } catch (err) {
      setError('Failed to fetch students. Please check your connection.');
      console.error('Fetch students error:', err);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [mslop]);

  const handleBack = () => {
    navigate('/cvht/classes');
  };

  // ✅ Check if data is loaded but students array is empty
  if (!loading && students.length === 0 && !error) {
    console.log('No students found, but API call succeeded');
  }

  return (
    <PageWrapper>
      <div className="space-y-6">
        {/* Error message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-red-700">{error}</p>
              <button 
                onClick={() => setError('')} 
                className="text-red-600 hover:text-red-800"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={handleBack}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Quay lại
          </button>
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">
              Lớp {mslop || '...'}
            </h2>
            {semesterInfo && (
              <p className="text-sm text-gray-500">
                Học kỳ: {getSemesterDisplayName(semesterInfo)}
              </p>
            )}
            {advisorInfo && (
              <p className="text-sm text-gray-500">
                Cố vấn: {advisorInfo.hoten} ({advisorInfo.username})
              </p>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Tổng sinh viên</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">{students.length}</dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Lớp</dt>
              <dd className="mt-1 text-lg font-semibold text-blue-600">{mslop}</dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Khoa</dt>
              <dd className="mt-1 text-lg font-semibold text-green-600">
                {classInfo?.department_name || students[0]?.department_name || 'N/A'}
              </dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Học kỳ</dt>
              <dd className="mt-1 text-lg font-semibold text-purple-600">
                {semesterInfo ? getSemesterDisplayName(semesterInfo) : 'N/A'}
              </dd>
            </div>
          </div>
        </div>

        {/* Student Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Danh sách sinh viên
            </h3>
            <span className="text-sm text-gray-500">{students.length} sinh viên</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    MSSV
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Họ tên
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Username
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cố vấn
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                      {error ? error : 'Không có sinh viên nào trong lớp này.'}
                    </td>
                  </tr>
                ) : (
                  students.map((student) => (
                    <tr key={student.mssv} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {student.mssv}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.hoten}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.cvht_name || '—'}
                      </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                    onClick={() => goToStudentDetails(student.mssv)}
               className="text-blue-600 hover:text-blue-900 transition-colors"
              >
                          Xem DRL
                         </button>
                  </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Empty state illustration */}
        {!loading && students.length === 0 && !error && (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Không có sinh viên</h3>
            <p className="mt-1 text-sm text-gray-500">
              Lớp này hiện không có sinh viên nào trong học kỳ này.
            </p>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}

export default ClassStudentList;