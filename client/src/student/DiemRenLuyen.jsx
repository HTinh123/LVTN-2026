import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Helper function to get semester display name
const getSemesterDisplayName = (sem) => {
  if (!sem) return 'N/A';
  if (sem.display_name) {
    // If display_name exists, format it as "HK2 (2025 - 2026)"
    const match = sem.display_name.match(/HK(\d+)\s*-\s*(\d{4})/);
    if (match) {
      const year = parseInt(match[2]);
      const nextYear = year + 1;
      return `HK${match[1]} (${year} - ${nextYear})`;
    }
    return sem.display_name;
  }
  const year = sem.nam;
  const nextYear = year + 1;
  return `HK${sem.hocky} (${year} - ${nextYear})`;
};

// Helper to determine if user can edit
const getEditableRoles = (user) => {
  if (!user) return [];
  const role = user.role;
  if (role === 'student') return ['sinhvien'];
  if (role === 'cvht') return ['cvht'];
  if (role === 'staff' || role === 'admin') return ['nhanvien'];
  return [];
};

function DiemRenLuyen() {
  const { mssv: urlMssv } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // --- State ---
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedDanhmuc, setExpandedDanhmuc] = useState({});
  const [selectedSemester, setSelectedSemester] = useState('');
  const [semesters, setSemesters] = useState([]);
  const [user, setUser] = useState({});
  const [studentScores, setStudentScores] = useState({});
  const [advisorScores, setAdvisorScores] = useState({});
  const [facultyScores, setFacultyScores] = useState({});
  const [bangdiemInfo, setBangdiemInfo] = useState(null);

  // --- Editing State ---
  const [editedScores, setEditedScores] = useState({
    sinhvien: {},
    cvht: {},
    nhanvien: {},
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // --- Modal State ---
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [modalData, setModalData] = useState(null);

  // --- Validation Modal ---
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');

  // --- Submission State ---
  const [submitting, setSubmitting] = useState(false);

  // --- Refs ---
  const isMounted = useRef(true);

  // --- Helper to get auth headers ---
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  };

  // --- Get mssv ---
  const getMssv = useCallback(() => {
    if (urlMssv) return urlMssv;
    return user?.mssv || user?.id;
  }, [urlMssv, user]);

  // --- Get user data ---
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
      } catch (err) {
        console.error('Error parsing user data:', err);
      }
    }
  }, []);

  // --- Fetch data ---
  useEffect(() => {
    const mssv = getMssv();
    if (mssv) {
      fetchHierarchy();
      fetchStudentSemesters(mssv);
    } else {
      // If no mssv available, stop loading
      setLoading(false);
    }
  }, [urlMssv, user]);

  // --- Fetch scores when semester changes ---
  useEffect(() => {
    const mssv = getMssv();
    if (selectedSemester && mssv) {
      fetchAllScores(mssv);
    }
  }, [selectedSemester, urlMssv, user]);

  // --- Fetch hierarchy ---
  const fetchHierarchy = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/staff/hierarchy`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        const sortedData = (data.data || [])
          .sort((a, b) => a.ms_danhmuc - b.ms_danhmuc)
          .map((danhmuc) => ({
            ...danhmuc,
            loai_list: (danhmuc.loai_list || [])
              .sort((a, b) => a.ms_loai - b.ms_loai)
              .map((loai) => ({
                ...loai,
                tieuchi_list: (loai.tieuchi_list || [])
                  .sort((a, b) => a.mstc - b.mstc),
              })),
          }));
        setData(sortedData);
        const initialExpanded = {};
        sortedData.forEach((_, idx) => { initialExpanded[idx] = true; });
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

  // --- Fetch semesters ---
  const fetchStudentSemesters = async (mssv) => {
    try {
      if (!mssv) return;
      const res = await fetch(
        `${BASE_URL}/api/student/students/${mssv}/semesters`,
        { headers: getAuthHeaders() }
      );
      const data = await res.json();
      if (data.success) {
        setSemesters(data.data.semesters || []);
        // Set default semester to current if available
        if (data.data.current_semester) {
          setSelectedSemester(data.data.current_semester.ms_hocky);
        } else if (data.data.semesters && data.data.semesters.length > 0) {
          setSelectedSemester(data.data.semesters[0].ms_hocky);
        }
      }
    } catch (err) {
      console.error('Error fetching semesters:', err);
      // If API fails, set an error message but don't break the UI
      setError('Không thể tải danh sách học kỳ. Vui lòng thử lại sau.');
    }
  };

  // --- Fetch scores ---
  const fetchAllScores = async (mssv) => {
    if (!mssv || !selectedSemester) return;
    try {
      const res = await fetch(
        `${BASE_URL}/api/student/students/${mssv}/semesters/${selectedSemester}/scores`,
        { headers: getAuthHeaders() }
      );
      const data = await res.json();
      if (data.success && data.data) {
        if (data.data.bangdiem) {
          setBangdiemInfo(data.data.bangdiem);
        }

        const evaluators = data.data.evaluators || {};

        const studentMap = {};
        if (evaluators.sinhvien?.chitiet) {
          evaluators.sinhvien.chitiet.forEach((item) => {
            studentMap[item.mstc] = item.diem_thucte;
          });
        }
        setStudentScores(studentMap);

        const advisorMap = {};
        if (evaluators.cvht?.chitiet) {
          evaluators.cvht.chitiet.forEach((item) => {
            advisorMap[item.mstc] = item.diem_thucte;
          });
        }
        setAdvisorScores(advisorMap);

        const facultyMap = {};
        if (evaluators.nhanvien?.chitiet) {
          evaluators.nhanvien.chitiet.forEach((item) => {
            facultyMap[item.mstc] = item.diem_thucte;
          });
        }
        setFacultyScores(facultyMap);
      } else {
        // No scores found - this is okay, just set empty maps
        setStudentScores({});
        setAdvisorScores({});
        setFacultyScores({});
      }
    } catch (err) {
      console.error('Error fetching scores:', err);
      // Don't set error for this - just use empty scores
      setStudentScores({});
      setAdvisorScores({});
      setFacultyScores({});
    }
  };

  // --- Toggle expand ---
  const toggleExpand = (index) => {
    setExpandedDanhmuc((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // --- Format helpers ---
  const toRoman = (num) => {
    const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
    return romanNumerals[num] || num;
  };
  const toLetter = (num) => String.fromCharCode(97 + num);
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  // --- Semester change ---
  const handleSemesterChange = (e) => {
    setSelectedSemester(e.target.value);
    // Reset edited scores when semester changes
    setEditedScores({ sinhvien: {}, cvht: {}, nhanvien: {} });
    setHasUnsavedChanges(false);
  };

  // --- Get selected semester object ---
  const selectedSemesterObj = semesters.find((s) => s.ms_hocky == selectedSemester);

  // --- Student display info ---
  const displayName = urlMssv
    ? user?.hoten || user?.username || `Student ${urlMssv}`
    : user?.hoten || user?.username || 'Student';
  const displayId = urlMssv || user?.mssv || user?.id || 'DH52001001';

  // --- Hardcoded DRL (temporary) ---
  const drlScore = 85;
  const ranking =
    drlScore >= 90
      ? 'Xuất sắc'
      : drlScore >= 80
      ? 'Giỏi'
      : drlScore >= 70
      ? 'Khá'
      : drlScore >= 60
      ? 'Trung bình'
      : 'Yếu';

  // --- Get editable roles ---
  const editableRoles = getEditableRoles(user);
  console.log('Editable roles:', editableRoles); // Debug

  // --- Get score from state (fetched or edited) ---
  const getScoreForDisplay = (mstc, role) => {
    const roleMap = {
      sinhvien: studentScores,
      cvht: advisorScores,
      nhanvien: facultyScores,
    };
    const editedMap = editedScores[role] || {};
    if (editedMap[mstc] !== undefined && editedMap[mstc] !== null) {
      return editedMap[mstc];
    }
    const fetched = roleMap[role] ? roleMap[role][mstc] : undefined;
    return fetched !== undefined ? fetched : null;
  };

  // --- Check if a tieuchi has been edited ---
  const isTieuchiEdited = (mstc, role) => {
    return (editedScores[role] && editedScores[role][mstc] !== undefined && editedScores[role][mstc] !== null);
  };

  // --- Open score edit modal ---
  const openScoreModal = (tieuchi, role, currentScore) => {
    setModalData({
      tieuchi,
      role,
      currentScore: currentScore !== null ? currentScore : 0,
      maxScore: tieuchi.diem,
    });
    setShowScoreModal(true);
  };

  // --- Handle score edit submission ---
  const handleScoreEditSubmit = (newValue) => {
    const { tieuchi, role } = modalData;
    setEditedScores((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        [tieuchi.mstc]: newValue,
      },
    }));
    setHasUnsavedChanges(true);
    setShowScoreModal(false);
    setModalData(null);
  };

  // --- Close modal ---
  const closeScoreModal = () => {
    setShowScoreModal(false);
    setModalData(null);
  };

  // --- Check if all tieuchi are edited ---
  const areAllTieuchiEdited = (role) => {
    const allTieuchi = [];
    data.forEach((danhmuc) => {
      (danhmuc.loai_list || []).forEach((loai) => {
        (loai.tieuchi_list || []).forEach((tc) => {
          allTieuchi.push(tc);
        });
      });
    });
    const allMstc = allTieuchi.map((tc) => tc.mstc);
    const editedMap = editedScores[role] || {};
    for (const mstc of allMstc) {
      if (editedMap[mstc] === undefined || editedMap[mstc] === null) {
        return false;
      }
    }
    return true;
  };

  // --- Get edited scores for a role ---
  const getEditedScoresForRole = (role) => {
    return editedScores[role] || {};
  };

  // --- Submit evaluation ---
  const handleSubmitEvaluation = async () => {
    if (editableRoles.length === 0) {
      setValidationMessage('Bạn không có quyền đánh giá.');
      setShowValidationModal(true);
      return;
    }

    // Check each editable role
    let hasMissing = false;
    for (const role of editableRoles) {
      if (!areAllTieuchiEdited(role)) {
        hasMissing = true;
        break;
      }
    }

    if (hasMissing) {
      setValidationMessage('Bạn chưa đánh giá hết tiêu chí. Vui lòng hoàn thành tất cả các tiêu chí trước khi gửi.');
      setShowValidationModal(true);
      return;
    }

    if (!bangdiemInfo) {
      setValidationMessage('Không tìm thấy bảng điểm cho sinh viên này trong học kỳ hiện tại.');
      setShowValidationModal(true);
      return;
    }

    setSubmitting(true);
    const errors = [];

    for (const role of editableRoles) {
      const scores = getEditedScoresForRole(role);
      const chitiet = Object.entries(scores).map(([mstc, diem_thucte]) => ({
        mstc: parseInt(mstc),
        diem_thucte: diem_thucte,
        ghi_chu: '',
      }));

      const diem_tong = chitiet.reduce((sum, item) => sum + item.diem_thucte, 0);

      const payload = {
        ms_bangdiem: bangdiemInfo.ms_bangdiem,
        nguoi_danhgia: role,
        nguoi_danhgia_id: role === 'sinhvien' ? getMssv() : user?.id || user?.ms_cvht || user?.msnv,
        nhan_xet: '',
        diem_tong: diem_tong,
        chitiet_danhgia: chitiet,
      };

      try {
        const res = await fetch(`${BASE_URL}/api/score/danhgia`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!data.success) {
          errors.push({ role, error: data.error || 'Lỗi không xác định' });
        }
      } catch (err) {
        errors.push({ role, error: err.message });
      }
    }

    setSubmitting(false);

    if (errors.length === 0) {
      alert('Đánh giá đã được lưu thành công!');
      setEditedScores({ sinhvien: {}, cvht: {}, nhanvien: {} });
      setHasUnsavedChanges(false);
      const mssv = getMssv();
      if (mssv) fetchAllScores(mssv);
    } else {
      const errorMsg = errors.map(e => `${e.role}: ${e.error}`).join('\n');
      alert(`Có lỗi xảy ra khi lưu đánh giá:\n${errorMsg}`);
    }
  };

  // --- Unsaved changes warning ---
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'Bạn có chắc muốn rời trang này không? Đánh giá của bạn chưa được lưu.';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // --- Render ---
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 max-w-4xl mx-auto mt-8">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
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
    <div className="flex gap-6">
      {/* Left Sidebar */}
      <div className="w-1/4 min-w-[220px] bg-white shadow rounded-lg p-6 h-fit sticky top-20">
        <div className="mb-6 pb-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xl font-semibold">{displayName.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{displayName}</p>
              <p className="text-xs text-gray-500">MSSV: {displayId}</p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Học kỳ</label>
          <select
            value={selectedSemester}
            onChange={handleSemesterChange}
            className="mt-1 w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            {semesters.length > 0 ? (
              semesters.map((sem) => (
                <option key={sem.ms_hocky} value={sem.ms_hocky}>
                  {getSemesterDisplayName(sem)}
                </option>
              ))
            ) : (
              <option value="">No semesters available</option>
            )}
          </select>
          {semesters.length > 0 && (
            <p className="mt-1 text-[10px] text-gray-400">{semesters.length} học kỳ đã tham gia</p>
          )}
        </div>

        <div className="space-y-3">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Điểm rèn luyện</span>
              <span className="text-lg font-bold text-blue-600">{drlScore}</span>
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Xếp loại</span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                ranking === 'Xuất sắc'
                  ? 'bg-green-100 text-green-800'
                  : ranking === 'Giỏi'
                  ? 'bg-blue-100 text-blue-800'
                  : ranking === 'Khá'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {ranking}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Điểm Rèn Luyện</h2>
          <div className="flex items-center gap-2">
            {hasUnsavedChanges && (
              <span className="text-xs text-yellow-600">* Có thay đổi chưa lưu</span>
            )}
            <button
              onClick={() => {
                fetchHierarchy();
                const mssv = getMssv();
                if (mssv) fetchAllScores(mssv);
              }}
              className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Làm mới
            </button>
          </div>
        </div>

        <div className="p-4">
          {data.map((danhmuc, danhmucIndex) => {
            const isExpanded = expandedDanhmuc[danhmucIndex] !== undefined ? expandedDanhmuc[danhmucIndex] : true;
            const romanIndex = toRoman(danhmucIndex);

            return (
              <div key={danhmuc.ms_danhmuc} className="mb-6 border border-gray-200 rounded-lg overflow-hidden">
                {/* Danhmuc Header */}
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
                    <span className="text-xs text-gray-400">({danhmuc.loai_list?.length || 0} loại)</span>
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

                {/* Child Tables */}
                {isExpanded && (
                  <div className="p-4 bg-white">
                    {danhmuc.loai_list && danhmuc.loai_list.length > 0 ? (
                      danhmuc.loai_list.map((loai, loaiIndex) => {
                        const letter = toLetter(loaiIndex);
                        const label = `${romanIndex}.${letter}`;

                        return (
                          <div key={loai.ms_loai} className="mb-6 last:mb-0">
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
                                  {loai.tieuchi_list && loai.tieuchi_list.length > 0 ? (
                                    loai.tieuchi_list.map((tieuchi) => {
                                      const canEditStudent = editableRoles.includes('sinhvien');
                                      const canEditAdvisor = editableRoles.includes('cvht');
                                      const canEditFaculty = editableRoles.includes('nhanvien');

                                      const studentScore = getScoreForDisplay(tieuchi.mstc, 'sinhvien');
                                      const advisorScore = getScoreForDisplay(tieuchi.mstc, 'cvht');
                                      const facultyScore = getScoreForDisplay(tieuchi.mstc, 'nhanvien');

                                      const displayStudentScore = studentScore !== null ? studentScore : '—';
                                      const displayAdvisorScore = advisorScore !== null ? advisorScore : '—';
                                      const displayFacultyScore = facultyScore !== null ? facultyScore : '—';

                                      return (
                                        <tr key={tieuchi.mstc} className="hover:bg-gray-50 transition-colors">
                                          <td className="px-4 py-2 text-sm text-gray-800">{tieuchi.ten_tieuchi}</td>
                                          <td className="px-4 py-2 text-sm text-gray-500">
                                            {selectedSemesterObj ? formatDate(selectedSemesterObj.ngay_batdau) : '—'}
                                          </td>
                                          <td className="px-4 py-2 text-sm text-gray-500">
                                            {selectedSemesterObj ? formatDate(selectedSemesterObj.ngay_ketthuc) : '—'}
                                          </td>

                                          {/* Điểm (Student) */}
                                          <td className="px-4 py-2 text-sm text-gray-500">
                                            <div className="flex items-center gap-1">
                                              <span>{displayStudentScore}</span>
                                              {canEditStudent && (
                                                <button
                                                  onClick={() => openScoreModal(tieuchi, 'sinhvien', studentScore)}
                                                  className="text-blue-400 hover:text-blue-600 transition-colors"
                                                  title="Sửa điểm"
                                                >
                                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                  </svg>
                                                </button>
                                              )}
                                              {isTieuchiEdited(tieuchi.mstc, 'sinhvien') && (
                                                <span className="text-xs text-yellow-500" title="Đã chỉnh sửa">*</span>
                                              )}
                                            </div>
                                          </td>

                                          {/* Điểm cố vấn (Advisor) */}
                                          <td className="px-4 py-2 text-sm text-gray-500">
                                            <div className="flex items-center gap-1">
                                              <span>{displayAdvisorScore}</span>
                                              {canEditAdvisor && (
                                                <button
                                                  onClick={() => openScoreModal(tieuchi, 'cvht', advisorScore)}
                                                  className="text-blue-400 hover:text-blue-600 transition-colors"
                                                  title="Sửa điểm cố vấn"
                                                >
                                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                  </svg>
                                                </button>
                                              )}
                                              {isTieuchiEdited(tieuchi.mstc, 'cvht') && (
                                                <span className="text-xs text-yellow-500" title="Đã chỉnh sửa">*</span>
                                              )}
                                            </div>
                                          </td>

                                          {/* Điểm khoa (Faculty) */}
                                          <td className="px-4 py-2 text-sm text-gray-500">
                                            <div className="flex items-center gap-1">
                                              <span>{displayFacultyScore}</span>
                                              {canEditFaculty && (
                                                <button
                                                  onClick={() => openScoreModal(tieuchi, 'nhanvien', facultyScore)}
                                                  className="text-blue-400 hover:text-blue-600 transition-colors"
                                                  title="Sửa điểm khoa"
                                                >
                                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                  </svg>
                                                </button>
                                              )}
                                              {isTieuchiEdited(tieuchi.mstc, 'nhanvien') && (
                                                <span className="text-xs text-yellow-500" title="Đã chỉnh sửa">*</span>
                                              )}
                                            </div>
                                          </td>
                                        </tr>
                                      );
                                    })
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
                      <div className="text-center py-4 text-sm text-gray-400">Không có loại nào trong danh mục này</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Submit Button */}
          {editableRoles.length > 0 && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSubmitEvaluation}
                disabled={submitting || !hasUnsavedChanges}
                className={`px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed ${
                  !hasUnsavedChanges ? 'opacity-50' : ''
                }`}
              >
                {submitting ? 'Đang lưu...' : 'Xác nhận đánh giá'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Score Edit Modal */}
      {showScoreModal && modalData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Chỉnh sửa điểm</h3>
            {modalData.tieuchi.type === 0 ? (
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">{modalData.tieuchi.ten_tieuchi}</span>
                  <span className="text-gray-400 ml-2">(tối đa {modalData.maxScore})</span>
                </p>
                <input
                  type="number"
                  defaultValue={modalData.currentScore}
                  min={0}
                  max={modalData.maxScore}
                  id="scoreInput"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={() => {
                      const input = document.getElementById('scoreInput');
                      const val = parseInt(input.value);
                      if (!isNaN(val) && val >= 0 && val <= modalData.maxScore) {
                        handleScoreEditSubmit(val);
                      } else {
                        alert(`Vui lòng nhập giá trị từ 0 đến ${modalData.maxScore}`);
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Lưu
                  </button>
                  <button onClick={closeScoreModal} className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">
                    Hủy
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-700 mb-4">
                  Sinh viên có <span className="font-semibold">{modalData.tieuchi.ten_tieuchi}</span> không?
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => handleScoreEditSubmit(-modalData.tieuchi.diem)}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Có
                  </button>
                  <button
                    onClick={() => handleScoreEditSubmit(0)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  >
                    Không
                  </button>
                  <button onClick={closeScoreModal} className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">
                    Hủy
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Validation Modal */}
      {showValidationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-2">Thông báo</h3>
            <p className="text-sm text-gray-700 mb-4">{validationMessage}</p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowValidationModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DiemRenLuyen;