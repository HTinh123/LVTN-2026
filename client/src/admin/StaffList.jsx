import React, { useState, useEffect } from 'react';
import PageWrapper from '../components/PageWrapper';

const BASE_URL = 'http://localhost:5000';

function StaffList() {
  const [staff, setStaff] = useState([]);
  const [stats, setStats] = useState({
    totalStaff: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState(''); // 'add', 'password', 'delete'
  const [selectedStaff, setSelectedStaff] = useState(null);
  
  // Form data for adding staff
  const [formData, setFormData] = useState({
    msnv: '',
    hoten: '',
    username: '',
    password: ''
  });
  
  // Password reset form
  const [passwordData, setPasswordData] = useState({
    newPassword: ''
  });
  
  const [warningMessage, setWarningMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  // Fetch staff on component mount
  useEffect(() => {
    fetchStaff();
  }, []);

  // Recalculate stats whenever staff changes
  useEffect(() => {
    calculateStats(staff);
  }, [staff]);

  const fetchStaff = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${BASE_URL}/api/admin/staff`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setStaff(data.data || []);
      } else {
        setError(data.error || 'Failed to fetch staff');
      }
    } catch (err) {
      setError('Failed to fetch staff. Please check your connection.');
      console.error('Fetch staff error:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (staffData) => {
    const totalStaff = staffData.length;
    setStats({
      totalStaff: totalStaff,
    });
  };

  // Handle adding new staff
  const handleAddStaff = () => {
    setModalMode('add');
    setFormData({
      msnv: '',
      hoten: '',
      username: '',
      password: ''
    });
    setWarningMessage('You are about to create a new staff account. Please fill in all required fields.');
    setShowModal(true);
  };

  // Handle reset password
  const handleResetPassword = (staff) => {
    setModalMode('password');
    setSelectedStaff(staff);
    setPasswordData({ newPassword: '' });
    setWarningMessage(`You are about to reset the password for staff "${staff.hoten}" (${staff.username}). This action cannot be undone.`);
    setShowModal(true);
  };

  // Handle delete staff
  const handleDeleteStaff = (staff) => {
    setModalMode('delete');
    setSelectedStaff(staff);
    setWarningMessage(`Are you sure you want to delete staff "${staff.hoten}" (${staff.username})? This action cannot be undone.`);
    setShowModal(true);
  };

  // Submit handler for all actions
  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      let url = '';
      let method = 'POST';
      let body = {};

      switch (modalMode) {
        case 'add':
          url = `${BASE_URL}/api/auth/staff/register`;
          method = 'POST';
          body = formData;
          break;
          
        case 'password':
          url = `${BASE_URL}/api/auth/staff/${selectedStaff.msnv}/reset-password`;
          method = 'POST';
          body = { newPassword: passwordData.newPassword };
          break;
          
        case 'delete':
          url = `${BASE_URL}/api/admin/staff/${selectedStaff.msnv}`;
          method = 'DELETE';
          body = {};
          break;
          
        default:
          throw new Error('Invalid action');
      }

      const res = await fetch(url, {
        method: method,
        headers: getAuthHeaders(),
        body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
      });

      const data = await res.json();
      
      if (data.success) {
        setSuccessMessage(data.message || 'Operation completed successfully');
        fetchStaff(); // Refresh the list
        setShowModal(false);
        
        // Clear success message after 3 seconds
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

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && staff.length === 0) {
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
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Total Staff</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.totalStaff}</dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Active Staff</dt>
              <dd className="mt-1 text-3xl font-semibold text-green-600">{stats.totalStaff}</dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Actions</dt>
              <dd className="mt-1">
                <button
                  onClick={handleAddStaff}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Add Staff
                </button>
              </dd>
            </div>
          </div>
        </div>

        {/* Staff Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Staff Management</h3>
            <button
              onClick={fetchStaff}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              <svg className="inline-block h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {staff.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                      No staff members found. Click "Add Staff" to create one.
                    </td>
                  </tr>
                ) : (
                  staff.map((member) => (
                    <tr key={member.msnv} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {member.msnv}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {member.hoten}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {member.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {member.role === 0 ? 'Staff' : 'Admin'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(member.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleResetPassword(member)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                        >
                          Reset Password
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          onClick={() => handleDeleteStaff(member)}
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

              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${
                      modalMode === 'add' ? 'bg-blue-100' : 
                      modalMode === 'password' ? 'bg-yellow-100' : 'bg-red-100'
                    } sm:mx-0 sm:h-10 sm:w-10`}>
                      {modalMode === 'add' && (
                        <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                      )}
                      {modalMode === 'password' && (
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
                        {modalMode === 'add' && 'Add New Staff'}
                        {modalMode === 'password' && 'Reset Password'}
                        {modalMode === 'delete' && 'Delete Staff'}
                      </h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">{warningMessage}</p>
                        
                        {/* Add Staff Form */}
                        {modalMode === 'add' && (
                          <div className="mt-4 space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Staff ID (MSNV) *</label>
                              <input
                                type="text"
                                required
                                value={formData.msnv}
                                onChange={(e) => setFormData({ ...formData, msnv: e.target.value })}
                                className="text-black mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="e.g., NV001"
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
                                placeholder="Enter full name"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Username *</label>
                              <input
                                type="text"
                                required
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                className="text-black mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="Enter username"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Password *</label>
                              <input
                                type="password"
                                required
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="text-black mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="Enter password (min 6 characters)"
                              />
                            </div>
                          </div>
                        )}
                        
                        {/* Reset Password Form */}
                        {modalMode === 'password' && (
                          <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700">New Password *</label>
                            <input
                              type="password"
                              required
                              value={passwordData.newPassword}
                              onChange={(e) => setPasswordData({ newPassword: e.target.value })}
                              className="text-black mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              placeholder="Enter new password (min 6 characters)"
                            />
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
                      (modalMode === 'add' && (!formData.msnv || !formData.hoten || !formData.username || !formData.password || formData.password.length < 6)) ||
                      (modalMode === 'password' && (!passwordData.newPassword || passwordData.newPassword.length < 6)) ||
                      loading
                    }
                    className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm ${
                      modalMode === 'add' ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500' :
                      modalMode === 'password' ? 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500' :
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
    </PageWrapper>
  );
}

export default StaffList;