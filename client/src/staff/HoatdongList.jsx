import React, { useState, useEffect, useRef } from 'react';
import PageWrapper from '../components/PageWrapper';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function HoatdongList() {
  const [activities, setActivities] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    totalDiem: 0,
    upcoming: 0,
    active: 0
  });
  const [currentUser, setCurrentUser] = useState(null);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState(''); // 'add', 'edit', 'delete'
  const [selectedActivity, setSelectedActivity] = useState(null);
  
  // Form data
  const [formData, setFormData] = useState({
    ten: '',
    msnv: '',
    mskhoa: [], // Now an array for checkboxes
    diem: 0,
    ghi_chu: '',
    thoi_gian_bat_dau: '',
    thoi_gian_ket_thuc: ''
  });
  
  // Image file state
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const fileInputRef = useRef(null);
  
  const [warningMessage, setWarningMessage] = useState('');

  // Helper function to get auth headers (with or without Content-Type for FormData)
  const getAuthHeaders = (isFormData = false) => {
    const token = localStorage.getItem('token');
    const headers = {
      'Authorization': `Bearer ${token}`
    };
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }
    return headers;
  };

  // Get current user from localStorage
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setCurrentUser(userData);
        // Auto-set msnv in form data
        const msnv = userData.msnv || userData.id;
        if (msnv) {
          setFormData(prev => ({ ...prev, msnv: msnv }));
        }
      } catch (err) {
        console.error('Error parsing user data:', err);
      }
    }
  }, []);

  // Fetch data on mount
  useEffect(() => {
    fetchDepartments();
    fetchActivities();
  }, []);

  // Fetch activities when department changes
  useEffect(() => {
    if (selectedDepartment) {
      fetchActivitiesByDepartment(selectedDepartment);
    } else {
      fetchActivities();
    }
  }, [selectedDepartment]);

  // Fetch all activities
  const fetchActivities = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${BASE_URL}/api/staff/hoat-dong`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setActivities(data.data || []);
        calculateStats(data.data || []);
      } else {
        setError(data.error || 'Failed to fetch activities');
      }
    } catch (err) {
      setError('Failed to fetch activities. Please check your connection.');
      console.error('Fetch activities error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch activities by department
  const fetchActivitiesByDepartment = async (mskhoa) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${BASE_URL}/api/staff/hoat-dong/khoa/${mskhoa}`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setActivities(data.data?.activities || data.data || []);
        calculateStats(data.data?.activities || data.data || []);
      } else {
        setActivities([]);
        setError(data.error || 'No activities found for this department');
      }
    } catch (err) {
      setActivities([]);
      setError('Failed to fetch activities. Please check your connection.');
      console.error('Fetch activities error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all departments
  const fetchDepartments = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/staff/departments`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setDepartments(data.data || []);
      }
    } catch (err) {
      console.error('Fetch departments error:', err);
    }
  };

  // Calculate stats
  const calculateStats = (data) => {
    const now = new Date();
    const total = data.length;
    const totalDiem = data.reduce((sum, item) => sum + (item.diem || 0), 0);
    const upcoming = data.filter(item => new Date(item.thoi_gian_bat_dau) > now).length;
    const active = data.filter(item => 
      new Date(item.thoi_gian_bat_dau) <= now && new Date(item.thoi_gian_ket_thuc) >= now
    ).length;
    setStats({ total, totalDiem, upcoming, active });
  };

  // Handle department change
  const handleDepartmentChange = (e) => {
    const value = e.target.value;
    setSelectedDepartment(value);
    setActivities([]);
  };

  // Handle department checkbox change in modal
  const handleDepartmentCheckbox = (mskhoa) => {
    setFormData(prev => {
      const current = prev.mskhoa || [];
      if (current.includes(mskhoa)) {
        return { ...prev, mskhoa: current.filter(id => id !== mskhoa) };
      } else {
        return { ...prev, mskhoa: [...current, mskhoa] };
      }
    });
  };

  // Handle image change
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('Only image files (JPEG, PNG, GIF, WebP) are allowed');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle add new activity
  const handleAdd = () => {
    const msnv = currentUser?.msnv || currentUser?.id || '';
    setModalMode('add');
    setFormData({
      ten: '',
      msnv: msnv,
      mskhoa: selectedDepartment ? [selectedDepartment] : [],
      diem: 0,
      ghi_chu: '',
      thoi_gian_bat_dau: '',
      thoi_gian_ket_thuc: ''
    });
    setImageFile(null);
    setImagePreview('');
    setWarningMessage('You are about to create a new activity. Please fill in all required fields.');
    setShowModal(true);
  };

  // Handle edit activity
  const handleEdit = (item) => {
    setModalMode('edit');
    setSelectedActivity(item);
    
    // Get department IDs from the departments array
    const deptIds = item.departments ? item.departments.map(d => d.ms_khoa) : [];
    
    // Format datetime for input fields
    const formatDateTime = (dateStr) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return date.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:MM
    };
    
    setFormData({
      ten: item.ten || '',
      msnv: item.msnv || '',
      mskhoa: deptIds,
      diem: item.diem || 0,
      ghi_chu: item.ghi_chu || '',
      thoi_gian_bat_dau: formatDateTime(item.thoi_gian_bat_dau),
      thoi_gian_ket_thuc: formatDateTime(item.thoi_gian_ket_thuc)
    });
    setImageFile(null);
    setImagePreview(item.img ? `${BASE_URL}/uploads/${item.img}` : '');
    setWarningMessage(`You are about to edit activity "${item.ten}".`);
    setShowModal(true);
  };

  // Handle delete activity
  const handleDelete = (item) => {
    setModalMode('delete');
    setSelectedActivity(item);
    setWarningMessage(`Are you sure you want to delete activity "${item.ten}"? This action cannot be undone.`);
    setShowModal(true);
  };

  // Submit handler with FormData for image upload
  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      let url = '';
      let method = 'POST';
      
      switch (modalMode) {
        case 'add':
          url = `${BASE_URL}/api/staff/hoat-dong`;
          method = 'POST';
          break;
          
        case 'edit':
          url = `${BASE_URL}/api/staff/hoat-dong/${selectedActivity.mshd}`;
          method = 'PUT';
          break;
          
        case 'delete':
          url = `${BASE_URL}/api/staff/hoat-dong/${selectedActivity.mshd}`;
          method = 'DELETE';
          break;
          
        default:
          throw new Error('Invalid action');
      }

      let res;
      
      if (modalMode === 'delete') {
        // Simple DELETE request
        res = await fetch(url, {
          method: method,
          headers: getAuthHeaders(),
        });
      } else {
        // Use FormData for add/edit (supports file upload)
        const formDataToSend = new FormData();
        formDataToSend.append('ten', formData.ten);
        formDataToSend.append('msnv', formData.msnv);
        formDataToSend.append('diem', parseInt(formData.diem) || 0);
        formDataToSend.append('ghi_chu', formData.ghi_chu || '');
        formDataToSend.append('thoi_gian_bat_dau', formData.thoi_gian_bat_dau);
        formDataToSend.append('thoi_gian_ket_thuc', formData.thoi_gian_ket_thuc);
        
        // Append department array
        if (formData.mskhoa && formData.mskhoa.length > 0) {
          formData.mskhoa.forEach(mskhoa => {
            formDataToSend.append('mskhoa', mskhoa);
          });
        }
        
        // Append image file if selected
        if (imageFile) {
          formDataToSend.append('img', imageFile);
        }
        
        res = await fetch(url, {
          method: method,
          headers: getAuthHeaders(true), // Don't set Content-Type for FormData
          body: formDataToSend,
        });
      }

      const data = await res.json();
      
      if (data.success) {
        setSuccessMessage(data.message || 'Operation completed successfully');
        if (selectedDepartment) {
          fetchActivitiesByDepartment(selectedDepartment);
        } else {
          fetchActivities();
        }
        setShowModal(false);
        
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      } else {
        setError(data.error || 'Operation failed');
      }
    } catch (err) {
      setError('Failed to perform operation. Please try again.');
      console.error('Submit error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Format datetime for display
  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get department names for display
  const getDepartmentNames = (item) => {
    if (item.departments && item.departments.length > 0) {
      return item.departments.map(d => d.ten_khoa).join(', ');
    }
    // Fallback for old data format
    if (item.mskhoa) {
      const dept = departments.find(d => d.ms_khoa === item.mskhoa);
      return dept ? dept.ten_khoa : item.mskhoa;
    }
    return '—';
  };

  // Get status badge for activity
  const getStatusBadge = (item) => {
    const now = new Date();
    const start = new Date(item.thoi_gian_bat_dau);
    const end = new Date(item.thoi_gian_ket_thuc);
    
    if (now < start) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">Upcoming</span>;
    } else if (now > end) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">Ended</span>;
    } else {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Active</span>;
    }
  };

  if (loading && activities.length === 0 && !selectedDepartment) {
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
        {/* Success message */}
        {successMessage && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
                <button 
                  onClick={() => setError('')}
                  className="mt-1 text-sm text-red-600 hover:text-red-800"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Total Activities</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.total}</dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Total Points</dt>
              <dd className="mt-1 text-3xl font-semibold text-blue-600">{stats.totalDiem}</dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Active Now</dt>
              <dd className="mt-1 text-3xl font-semibold text-green-600">{stats.active}</dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Actions</dt>
              <dd className="mt-1">
                <button
                  onClick={handleAdd}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Add Activity
                </button>
              </dd>
            </div>
          </div>
        </div>

        {/* Department Dropdown and Refresh */}
        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="w-full sm:w-64">
              <label className="block text-sm font-medium text-gray-700">Filter by Department</label>
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
            <button
              onClick={() => {
                if (selectedDepartment) {
                  fetchActivitiesByDepartment(selectedDepartment);
                } else {
                  fetchActivities();
                }
              }}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="inline-block h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Activities Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Activity Management
              {selectedDepartment && ` - ${departments.find(d => d.ms_khoa === selectedDepartment)?.ten_khoa || ''}`}
            </h3>
            <span className="text-sm text-gray-500">{activities.length} activity(ies)</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department(s)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading && activities.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : activities.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">
                      {selectedDepartment ? 'No activities found for this department.' : 'No activities found. Click "Add Activity" to create one.'}
                    </td>
                  </tr>
                ) : (
                  activities.map((item) => (
                    <tr key={item.mshd} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.mshd}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="font-medium">{item.ten}</div>
                        {item.nhanvien_name && (
                          <div className="text-xs text-gray-500">by {item.nhanvien_name}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="max-w-xs truncate" title={getDepartmentNames(item)}>
                          {getDepartmentNames(item)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>{formatDateTime(item.thoi_gian_bat_dau)}</div>
                        <div className="text-xs text-gray-400">to</div>
                        <div>{formatDateTime(item.thoi_gian_ket_thuc)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(item)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.img ? (
                          <img 
                            src={`${BASE_URL}/uploads/${item.img}`} 
                            alt={item.ten}
                            className="h-10 w-10 object-cover rounded"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '';
                              e.target.alt = 'No image';
                            }}
                          />
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {item.diem}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                        >
                          Edit
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          onClick={() => handleDelete(item)}
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

        {/* Action Modal */}
        {showModal && (
          <div className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>

              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${
                      modalMode === 'add' || modalMode === 'edit' ? 'bg-blue-100' : 'bg-red-100'
                    } sm:mx-0 sm:h-10 sm:w-10`}>
                      {(modalMode === 'add' || modalMode === 'edit') && (
                        <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
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
                        {modalMode === 'add' && 'Add New Activity'}
                        {modalMode === 'edit' && 'Edit Activity'}
                        {modalMode === 'delete' && 'Delete Activity'}
                      </h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">{warningMessage}</p>
                        
                        {/* Add/Edit Form */}
                        {(modalMode === 'add' || modalMode === 'edit') && (
                          <div className="mt-4 grid grid-cols-2 gap-3">
                            <div className="col-span-2">
                              <label className="block text-sm font-medium text-gray-700">Activity Name *</label>
                              <input
                                type="text"
                                required
                                value={formData.ten}
                                onChange={(e) => setFormData({ ...formData, ten: e.target.value })}
                                className="text-black mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="Enter activity name"
                              />
                            </div>
                            
                            {/* Time fields */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Start Time *</label>
                              <input
                                type="datetime-local"
                                required
                                value={formData.thoi_gian_bat_dau}
                                onChange={(e) => setFormData({ ...formData, thoi_gian_bat_dau: e.target.value })}
                                className="text-black mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">End Time *</label>
                              <input
                                type="datetime-local"
                                required
                                value={formData.thoi_gian_ket_thuc}
                                onChange={(e) => setFormData({ ...formData, thoi_gian_ket_thuc: e.target.value })}
                                className="text-black mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Points *</label>
                              <input
                                type="number"
                                required
                                value={formData.diem}
                                onChange={(e) => setFormData({ ...formData, diem: parseInt(e.target.value) || 0 })}
                                className="text-black mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="Enter points"
                                min="0"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Staff *</label>
                              <input
                                type="text"
                                value={currentUser?.hoten || currentUser?.username || formData.msnv}
                                disabled
                                className="text-black mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-3 bg-gray-100 text-gray-500 cursor-not-allowed sm:text-sm"
                              />
                            </div>
                            
                            {/* Department Checkboxes */}
                            <div className="col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-2">Departments *</label>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3">
                                {departments.map(dept => (
                                  <label key={dept.ms_khoa} className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={formData.mskhoa?.includes(dept.ms_khoa) || false}
                                      onChange={() => handleDepartmentCheckbox(dept.ms_khoa)}
                                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <span className="text-sm text-gray-700">{dept.ten_khoa}</span>
                                  </label>
                                ))}
                              </div>
                              {formData.mskhoa?.length === 0 && (
                                <p className="text-xs text-red-500 mt-1">Please select at least one department</p>
                              )}
                            </div>
                            
                            <div className="col-span-2">
                              <label className="block text-sm font-medium text-gray-700">Note</label>
                              <input
                                type="text"
                                value={formData.ghi_chu}
                                onChange={(e) => setFormData({ ...formData, ghi_chu: e.target.value })}
                                className="text-black mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="Enter note (optional)"
                              />
                            </div>
                            
                            {/* Image Upload */}
                            <div className="col-span-2">
                              <label className="block text-sm font-medium text-gray-700">Image</label>
                              <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="text-black mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm file:mr-4 file:py-1 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                              />
                              {imagePreview && (
                                <div className="mt-2">
                                  <img 
                                    src={imagePreview} 
                                    alt="Preview" 
                                    className="h-20 w-20 object-cover rounded border border-gray-200"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setImageFile(null);
                                      setImagePreview('');
                                      if (fileInputRef.current) {
                                        fileInputRef.current.value = '';
                                      }
                                    }}
                                    className="ml-2 text-xs text-red-600 hover:text-red-800"
                                  >
                                    Remove
                                  </button>
                                </div>
                              )}
                              {formData.img && !imagePreview && modalMode === 'edit' && (
                                <div className="mt-2">
                                  <img 
                                    src={`${BASE_URL}/uploads/${formData.img}`} 
                                    alt="Current" 
                                    className="h-20 w-20 object-cover rounded border border-gray-200"
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.style.display = 'none';
                                    }}
                                  />
                                  <span className="text-xs text-gray-500 ml-2">Current image</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    onClick={handleSubmit}
                    disabled={
                      (modalMode === 'add' && (!formData.ten || !formData.mskhoa || formData.mskhoa.length === 0 || !formData.thoi_gian_bat_dau || !formData.thoi_gian_ket_thuc)) ||
                      (modalMode === 'edit' && (!formData.ten || !formData.mskhoa || formData.mskhoa.length === 0 || !formData.thoi_gian_bat_dau || !formData.thoi_gian_ket_thuc)) ||
                      loading
                    }
                    className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm ${
                      (modalMode === 'add' || modalMode === 'edit') ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500' : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
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
    </PageWrapper>
  );
}

export default HoatdongList;