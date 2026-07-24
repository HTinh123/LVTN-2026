const db = require('../../db');

const studentController = {

// ========== GET SEMESTERS FOR A STUDENT ==========
getStudentSemesters: async (req, res) => {
    const { mssv } = req.params;
    
    try {
        // Check if student exists
        const [student] = await db.query(
            "SELECT mssv, hoten FROM sinhvien WHERE mssv = ?",
            [mssv]
        );
        
        if (student.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Student not found'
            });
        }
        
        // Get all semesters the student is enrolled in
        const [semesters] = await db.query(
            `SELECT 
                h.ms_hocky,
                h.hocky,
                h.nam,
                h.ngay_batdau,
                h.ngay_ketthuc,
                CONCAT('HK', h.hocky, ' - ', h.nam) AS display_name,
                sl.mslop,
                sl.created_at AS enrolled_date
             FROM sinhvien_lop sl
             INNER JOIN hocky h ON sl.ms_hocky = h.ms_hocky
             WHERE sl.mssv = ?
             ORDER BY h.nam DESC, h.hocky DESC`,
            [mssv]
        );
        
        if (semesters.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'No semesters found for this student'
            });
        }
        
        // Determine current semester based on current date
        const now = new Date();
        let currentSemester = null;
        
        for (const sem of semesters) {
            const startDate = new Date(sem.ngay_batdau);
            const endDate = new Date(sem.ngay_ketthuc);
            
            // Check if current date falls within this semester
            if (now >= startDate && now <= endDate) {
                currentSemester = sem;
                break;
            }
        }
        
        // If no current semester found, use the most recent one (first in the list)
        if (!currentSemester && semesters.length > 0) {
            currentSemester = semesters[0];
        }
        
        res.json({
            success: true,
            data: {
                student: student[0],
                semesters: semesters,
                current_semester: currentSemester,
                total_semesters: semesters.length
            }
        });
    } catch (err) {
        console.error('Error in getStudentSemesters:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
},

// ========== GET STUDENT SCORES FOR A SEMESTER (All Evaluators) ==========
getStudentScoresBySemester: async (req, res) => {
    const { mssv, ms_hocky } = req.params;
    
    try {
        // Check if student exists
        const [student] = await db.query(
            "SELECT mssv, hoten FROM sinhvien WHERE mssv = ?",
            [mssv]
        );
        
        if (student.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Student not found'
            });
        }
        
        // Get bangdiem for this student and semester
        const [bangdiem] = await db.query(
            `SELECT ms_bangdiem, mssv, ms_hocky, diem_tong, xeploai 
             FROM bangdiem 
             WHERE mssv = ? AND ms_hocky = ?`,
            [mssv, ms_hocky]
        );
        
        if (bangdiem.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'No bangdiem found for this student and semester'
            });
        }
        
        // Get all danhgia for this bangdiem (student, cvht, nhanvien)
        const [danhgiaList] = await db.query(
            `SELECT ms_danhgia, nguoi_danhgia, diem_tong, nhan_xet, trang_thai 
             FROM danhgia 
             WHERE ms_bangdiem = ?`,
            [bangdiem[0].ms_bangdiem]
        );
        
        // Organize by evaluator type
        const evaluators = {
            sinhvien: null,
            cvht: null,
            nhanvien: null
        };
        
        for (const dg of danhgiaList) {
            const type = dg.nguoi_danhgia;
            
            // Get chitiet_danhgia for this danhgia
            const [chitietResult] = await db.query(
                `SELECT cd.ms_ctdg, cd.mstc, cd.diem_thucte, cd.batdau, cd.ketthuc, cd.ghi_chu,
                        t.ten_tieuchi, t.diem as diem_toida
                 FROM chitiet_danhgia cd
                 INNER JOIN tieuchi t ON cd.mstc = t.mstc
                 WHERE cd.ms_danhgia = ?`,
                [dg.ms_danhgia]
            );
            
            evaluators[type] = {
                ...dg,
                chitiet: chitietResult
            };
        }
        
        res.json({
            success: true,
            data: {
                student: student[0],
                bangdiem: bangdiem[0],
                evaluators: evaluators
            }
        });
    } catch (err) {
        console.error('Error in getStudentScoresBySemester:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
},

// ========== GET DEPARTMENT BY MSSV (Simple Version for Quick Lookup) ==========
// getDepartmentByMssv: async (req, res) => {
//     const { mssv } = req.params;
    
//     try {
//         const [result] = await db.query(
//             `SELECT 
//                 k.ms_khoa,
//                 k.ten_khoa
//              FROM sinhvien_lop sl
//              INNER JOIN lop l ON sl.mslop = l.mslop
//              INNER JOIN khoa k ON l.ms_khoa = k.ms_khoa
//              WHERE sl.mssv = ?
//              LIMIT 1`,
//             [mssv]
//         );
        
//         if (result.length === 0) {
//             return res.status(404).json({
//                 success: false,
//                 error: 'Student not found or not assigned to any class'
//             });
//         }
        
//         res.json({
//             success: true,
//             data: {
//                 ms_khoa: result[0].ms_khoa,
//                 ten_khoa: result[0].ten_khoa
//             }
//         });
//     } catch (err) {
//         console.error('Error in getDepartmentByMssv:', err);
//         res.status(500).json({ 
//             success: false, 
//             error: err.message 
//         });
//     }
// },

// Get student's departments based on enrollment
getStudentKhoa: async (req, res) => {
    const { mssv } = req.params;
    
    try {
        const [khoa] = await db.query(
            `SELECT DISTINCT k.ms_khoa, k.ten_khoa
             FROM sinhvien sv
             JOIN sinhvien_lop svl ON sv.mssv = svl.mssv
             JOIN lop l ON svl.mslop = l.mslop
             JOIN khoa k ON l.ms_khoa = k.ms_khoa
             WHERE sv.mssv = ?`,
            [mssv]
        );
        
        res.json({
            success: true,
            data: khoa
        });
    } catch (err) {
        console.error('Error fetching student khoa:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
},
}
module.exports = studentController;