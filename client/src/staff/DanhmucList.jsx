import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../components/PageWrapper';

const BASE_URL =  'http://localhost:5000';

function DanhmucList() {
  const navigate = useNavigate();
  const [danhmucs, setDanhmucs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState(''); // 'add', 'edit', 'delete'
  const [selectedDanhmuc, setSelectedDanhmuc] = useState(null);
  
  // Form data
  const [formData, setFormData] = useState({
    ten_danhmuc: ''
  });
  
  const [warningMessage, setWarningMessage] = useState('');

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  // Fetch danhmucs on component mount
  useEffect(() => {
    fetchDanhmucs();
  }, []);

  // Fetch all danhmucs
  const fetchDanhmucs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${BASE_URL}/api/staff/danhmuc`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setDanhmucs(data.data || []);
      } else {
        setError(data.error || 'Failed to fetch danhmucs');
      }
    } catch (err) {
      setError('Failed to fetch danhmucs. Please check your connection.');
      console.error('Fetch danhmucs error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle add new danhmuc
  const handleAdd = () => {
    setModalMode('add');
    setFormData({ ten_danhmuc: '' });
    setWarningMessage('You are about to create a new danhmuc. Please fill in all required fields.');
    setShowModal(true);
  };

  // Handle edit danhmuc
  const handleEdit = (item) => {
    setModalMode('edit');
    setSelectedDanhmuc(item);
    setFormData({ ten_danhmuc: item.ten_danhmuc });
    setWarningMessage(`You are about to edit danhmuc "${item.ten_danhmuc}".`);
    setShowModal(true);
  };

  // Handle delete danhmuc
  const handleDelete = (item) => {
    setModalMode('delete');
    setSelectedDanhmuc(item);
    setWarningMessage(`Are you sure you want to delete danhmuc "${item.ten_danhmuc}"? This will also delete all associated loai and tieuchi.`);
    setShowModal(true);
  };

  // Handle click on danhmuc row - navigate to LoaiList
  const handleRowClick = (item) => {
    navigate(`/staff/danhmuc/${item.ms_danhmuc}/loai`);
  };

  // Submit handler
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
          url = `${BASE_URL}/api/staff/danhmuc`;
          method = 'POST';
          body = { ten_danhmuc: formData.ten_danhmuc };
          break;
          
        case 'edit':
          url = `${BASE_URL}/api/staff/danhmuc/${selectedDanhmuc.ms_danhmuc}`;
          method = 'PUT';
          body = { ten_danhmuc: formData.ten_danhmuc };
          break;
          
        case 'delete':
          url = `${BASE_URL}/api/staff/danhmuc/${selectedDanhmuc.ms_danhmuc}`;
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
        fetchDanhmucs();
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

  if (loading && danhmucs.length === 0) {
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
              <dt className="text-sm font-medium text-gray-500 truncate">Total Danhmuc</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">{danhmucs.length}</dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Active Danhmuc</dt>
              <dd className="mt-1 text-3xl font-semibold text-green-600">{danhmucs.length}</dd>
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
                  Add Danhmuc
                </button>
              </dd>
            </div>
          </div>
        </div>

        {/* Danhmuc Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Danhmuc Management</h3>
            <button
              onClick={fetchDanhmucs}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên Danhmuc</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Điểm</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {danhmucs.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                      No danhmuc found. Click "Add Danhmuc" to create one.
                    </td>
                  </tr>
                ) : (
                  danhmucs.map((item) => (
                    <tr 
                      key={item.ms_danhmuc} 
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => handleRowClick(item)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.ms_danhmuc}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.ten_danhmuc}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.diem_danhmuc || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(item);
                          }}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                        >
                          Edit
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(item);
                          }}
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
                        {modalMode === 'add' && 'Add New Danhmuc'}
                        {modalMode === 'edit' && 'Edit Danhmuc'}
                        {modalMode === 'delete' && 'Delete Danhmuc'}
                      </h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">{warningMessage}</p>
                        
                        {(modalMode === 'add' || modalMode === 'edit') && (
                          <div className="mt-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Tên Danhmuc *</label>
                              <input
                                type="text"
                                required
                                value={formData.ten_danhmuc}
                                onChange={(e) => setFormData({ ...formData, ten_danhmuc: e.target.value })}
                                className="text-black mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="Enter danhmuc name"
                              />
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
                      ((modalMode === 'add' || modalMode === 'edit') && !formData.ten_danhmuc) ||
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

export default DanhmucList;