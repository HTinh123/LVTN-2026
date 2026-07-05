import React, { useState, useEffect } from 'react';

const BASE_URL = 'http://localhost:5000';

function DiemRenLuyen() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedDanhmuc, setExpandedDanhmuc] = useState({});

  // Helper to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  // Fetch full hierarchy
  useEffect(() => {
    fetchHierarchy();
  }, []);

  const fetchHierarchy = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/staff/hierarchy`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setData(data.data || []);
        // Initialize expanded state: expand all by default
        const initialExpanded = {};
        data.data.forEach((item, index) => {
          initialExpanded[index] = true;
        });
        setExpandedDanhmuc(initialExpanded);
      } else {
        setError(data.error || 'Failed to load data');
      }
    } catch (err) {
      setError('Error loading data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Toggle expand/collapse for a danhmuc
  const toggleExpand = (index) => {
    setExpandedDanhmuc(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Convert number to Roman numeral (for danhmuc)
  const toRoman = (num) => {
    const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
    return romanNumerals[num] || num;
  };

  // Convert number to lowercase letter (for loai)
  const toLetter = (num) => {
    return String.fromCharCode(97 + num); // 97 = 'a'
  };

  // Format date (placeholder)
  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('vi-VN');
  };

  if (loading) {
    return (
      
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      
    );
  }

  if (error) {
    return (
      
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
              <button onClick={fetchHierarchy} className="mt-1 text-sm text-red-600 hover:text-red-800">
                Retry
              </button>
            </div>
          </div>
        </div>
      
    );
  }

  if (data.length === 0) {
    return (
      
        <div className="text-center py-12">
          <p className="text-gray-500">No data available. Please add danhmuc, loai, and tieuchi first.</p>
        </div>
      
    );
  }

  return (
    
      <div className="bg-white shadow rounded-lg overflow-hidden">
        

        <div className="p-4">
          {data.map((danhmuc, danhmucIndex) => {
            const isExpanded = expandedDanhmuc[danhmucIndex] !== undefined ? expandedDanhmuc[danhmucIndex] : true;
            const romanIndex = toRoman(danhmucIndex);

            return (
              <div key={danhmuc.ms_danhmuc} className="mb-6 border border-gray-200 rounded-lg overflow-hidden">
                {/* Danhmuc Header Row */}
                <div
                  className="bg-gray-50 px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => toggleExpand(danhmucIndex)}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-gray-800">
                      {romanIndex}. {danhmuc.ten_danhmuc}
                    </span>
                    <span className="text-sm text-gray-500">
                      Tổng điểm: <span className="font-semibold text-blue-600">{danhmuc.diem_danhmuc}</span>
                    </span>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600 transition-colors">
                    <svg
                      className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {/* Child Tables - only if expanded */}
                {isExpanded && (
                  <div className="p-4 bg-white">
                    {danhmuc.loai_list && danhmuc.loai_list.length > 0 ? (
                      danhmuc.loai_list.map((loai, loaiIndex) => {
                        const letter = toLetter(loaiIndex);
                        const label = `${romanIndex}.${letter}`;

                        return (
                          <div key={loai.ms_loai} className="mb-6 last:mb-0">
                            {/* Loai Table */}
                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-blue-50">
                                  <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-1/3">
                                      {label} {loai.ten_loai}
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                      Ngày bắt đầu
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                      Ngày kết thúc
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                      Điểm
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                      Điểm cố vấn
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                      Điểm khoa
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {/* Tieuchi rows */}
                                  {loai.tieuchi_list && loai.tieuchi_list.length > 0 ? (
                                    loai.tieuchi_list.map((tieuchi) => (
                                      <tr key={tieuchi.mstc} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-2 text-sm text-gray-800">
                                          {tieuchi.ten_tieuchi}
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-500">
                                          {/* Placeholder - no data yet */}
                                          <span className="text-gray-300">—</span>
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-500">
                                          <span className="text-gray-300">—</span>
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-500">
                                          {tieuchi.diem || 0}
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-500">
                                          <span className="text-gray-300">—</span>
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-500">
                                          <span className="text-gray-300">—</span>
                                        </td>
                                      </tr>
                                    ))
                                  ) : (
                                    <tr>
                                      <td colSpan="6" className="px-4 py-4 text-center text-sm text-gray-400">
                                        Không có tiêu chí nào
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-4 text-sm text-gray-400">
                        Không có loại nào trong danh mục này
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    
  );
}

export default DiemRenLuyen;