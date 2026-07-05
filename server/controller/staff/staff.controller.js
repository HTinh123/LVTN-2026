const db = require('../../db');

const staffController = {
    // ========== GET ALL CVHT ==========
    getAllCvht: async (req, res) => {
        try {
            const [results] = await db.query(
                `SELECT ms_cvht, username, hoten, created_at 
                 FROM cvht 
                 ORDER BY created_at DESC`
            );
            
            res.json({
                success: true,
                data: results,
                count: results.length
            });
        } catch (err) {
            console.error('Error in getAllCvht:', err);
            res.status(500).json({ 
                success: false, 
                error: err.message 
            });
        }
    },

    // ========== GET SINGLE CVHT BY ID ==========
    getCvhtById: async (req, res) => {
        const { ms_cvht } = req.params;
        
        try {
            const [results] = await db.query(
                `SELECT ms_cvht, username, hoten, created_at 
                 FROM cvht 
                 WHERE ms_cvht = ?`,
                [ms_cvht]
            );
            
            if (results.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'CVHT member not found'
                });
            }
            
            res.json({
                success: true,
                data: results[0]
            });
        } catch (err) {
            console.error('Error in getCvhtById:', err);
            res.status(500).json({ 
                success: false, 
                error: err.message 
            });
        }
    },

    // ========== DELETE CVHT ==========
    deleteCvht: async (req, res) => {
        const { ms_cvht } = req.params;
        
        try {
            // Check if CVHT exists
            const [cvht] = await db.query(
                "SELECT * FROM cvht WHERE ms_cvht = ?",
                [ms_cvht]
            );
            
            if (cvht.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'CVHT member not found'
                });
            }
            
            // Delete CVHT
            await db.query(
                "DELETE FROM cvht WHERE ms_cvht = ?",
                [ms_cvht]
            );
            
            res.json({
                success: true,
                message: 'CVHT member deleted successfully'
            });
        } catch (err) {
            console.error('Error in deleteCvht:', err);
            res.status(500).json({ 
                success: false, 
                error: err.message 
            });
        }
    },

    // ========== GET ALL SEMESTERS ==========
getAllSemesters: async (req, res) => {
    try {
        const [results] = await db.query(
            `SELECT ms_hocky, hocky, nam, ngay_batdau, ngay_ketthuc,
                    CONCAT('HK', hocky, ' - ', nam) AS display_name
             FROM hocky 
             ORDER BY nam DESC, hocky DESC`
        );
        
        res.json({
            success: true,
            data: results,
            count: results.length
        });
    } catch (err) {
        console.error('Error in getAllSemesters:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
},

// Helper: Get Semester by ID
    getSemesterById: async (ms_hocky) => {
        try {
            const [result] = await db.query(
                `SELECT ms_hocky, hocky, nam, ngay_batdau, ngay_ketthuc 
                 FROM hocky 
                 WHERE ms_hocky = ?`,
                [ms_hocky]
            );
            return result[0] || null;
        } catch (err) {
            console.error('Error in getSemesterById:', err);
            return null;
        }
    },

    // GET Semester by ID
    getSemester: async (req, res) => {
        const { ms_hocky } = req.params;
        
        try {
           
            const semester = await staffController.getSemesterById(ms_hocky);
            
            if (!semester) {
                return res.status(404).json({
                    success: false,
                    error: 'Semester not found'
                });
            }
            
            res.json({
                success: true,
                data: semester
            });
        } catch (err) {
            console.error('Error in getSemester:', err);
            res.status(500).json({ 
                success: false, 
                error: err.message 
            });
        }
    },

    // Helper: Get Current/Latest Semester
    getLatestSemester: async () => {
        try {
            const [result] = await db.query(
                `SELECT ms_hocky, hocky, nam, ngay_batdau, ngay_ketthuc 
                 FROM hocky 
                 ORDER BY nam DESC, hocky DESC 
                 LIMIT 1`
            );
            return result[0] || null;
        } catch (err) {
            console.error('Error in getLatestSemester:', err);
            return null;
        }
    },

    // GET Current/Active Semester
    getCurrentSemester: async (req, res) => {
        try {
            const semester = await staffController.getLatestSemester();
            
            if (!semester) {
                return res.status(404).json({
                    success: false,
                    error: 'No active semester found'
                });
            }
            
            res.json({
                success: true,
                data: semester
            });
        } catch (err) {
            console.error('Error in getCurrentSemester:', err);
            res.status(500).json({ 
                success: false, 
                error: err.message 
            });
        }
    },



// ========== GET CLASS STATISTICS BY CVHT (Latest Semester Only) ==========
getClassStatsByCvht: async (req, res) => {
    try {
        // Get latest semester
        const latestSemester = await staffController.getLatestSemester();
        
        if (!latestSemester) {
            return res.status(404).json({
                success: false,
                error: 'No semester found'
            });
        }

        const [results] = await db.query(
            `SELECT 
                c.ms_cvht,
                c.hoten AS name,
                c.username,
                COUNT(DISTINCT cl.mslop) AS classCount,
                COUNT(DISTINCT sl.mssv) AS totalStudents
               
             FROM cvht c
             LEFT JOIN cvht_lop cl ON c.ms_cvht = cl.ms_cvht AND cl.ms_hocky = ?
             LEFT JOIN lop l ON cl.mslop = l.mslop
             LEFT JOIN sinhvien_lop sl ON l.mslop = sl.mslop AND sl.ms_hocky = ?
             LEFT JOIN sinhvien s ON sl.mssv = s.mssv
             GROUP BY c.ms_cvht, c.hoten, c.username
             ORDER BY classCount DESC`,
            [latestSemester.ms_hocky, latestSemester.ms_hocky]
        );
        
        res.json({
            success: true,
            data: results,
            count: results.length,
            semester: latestSemester
        });
    } catch (err) {
        console.error('Error in getClassStatsByCvht:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
},

// ========== GET ALL STUDENTS (with semester parameter) ==========
getAllStudents: async (req, res) => {
    const { ms_hocky } = req.query;
    
    try {
        let semester;
        let semesterId;
        
        if (ms_hocky) {
            semester = await staffController.getSemesterById(ms_hocky);
            if (!semester) {
                return res.status(404).json({
                    success: false,
                    error: 'Semester not found'
                });
            }
            semesterId = ms_hocky;
        } else {
            semester = await staffController.getLatestSemester();
            if (!semester) {
                return res.status(404).json({
                    success: false,
                    error: 'No semester found'
                });
            }
            semesterId = semester.ms_hocky;
        }

        // ✅ Use INNER JOIN instead of LEFT JOIN to only get students in this semester
        const [results] = await db.query(
            `SELECT 
                s.mssv, 
                s.username, 
                s.hoten, 
                
                s.created_at, 
                s.valid_until,
                sl.mslop AS current_class,
                sl.ms_hocky AS current_semester_id,
                l.ms_khoa AS department_id,
                k.ten_khoa AS department_name,
                CONCAT('HK', h.hocky, ' - ', h.nam) AS semester_name,
                cl.ms_cvht AS cvht_id,
                cv.hoten AS cvht_name
             FROM sinhvien s
             INNER JOIN sinhvien_lop sl ON s.mssv = sl.mssv AND sl.ms_hocky = ?
             INNER JOIN lop l ON sl.mslop = l.mslop
             INNER JOIN khoa k ON l.ms_khoa = k.ms_khoa
             INNER JOIN hocky h ON sl.ms_hocky = h.ms_hocky
             LEFT JOIN cvht_lop cl ON l.mslop = cl.mslop AND cl.ms_hocky = sl.ms_hocky
             LEFT JOIN cvht cv ON cl.ms_cvht = cv.ms_cvht
             ORDER BY s.created_at DESC`,
            [semesterId]
        );
        
        // Get all semesters for dropdown
        const [allSemesters] = await db.query(
            `SELECT ms_hocky, CONCAT('HK', hocky, ' - ', nam) AS display_name 
             FROM hocky 
             ORDER BY nam DESC, hocky DESC`
        );
        
        res.json({
            success: true,
            data: results,
            count: results.length,
            current_semester: semester,
            all_semesters: allSemesters
        });
    } catch (err) {
        console.error('Error in getAllStudents:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
},

// ========== GET STUDENT BY MSSV (with semester parameter) ==========
getStudentByMssv: async (req, res) => {
    const { mssv } = req.params;
    const { ms_hocky } = req.query; // Get semester from query parameter
    
    try {
        let semester;
        let semesterId;
        
        if (ms_hocky) {
            // Use specified semester
            semester = await staffController.getSemesterById(ms_hocky);
            if (!semester) {
                return res.status(404).json({
                    success: false,
                    error: 'Semester not found'
                });
            }
            semesterId = ms_hocky;
        } else {
            // Use latest semester if not specified
            semester = await staffController.getLatestSemester();
            if (!semester) {
                return res.status(404).json({
                    success: false,
                    error: 'No semester found'
                });
            }
            semesterId = semester.ms_hocky;
        }

        const [results] = await db.query(
            `SELECT 
                s.mssv, 
                s.username, 
                s.hoten, 
                 
                s.created_at, 
                s.valid_until,
                sl.mslop AS current_class,
                sl.ms_hocky AS current_semester_id,
                l.ms_khoa AS department_id,
                k.ten_khoa AS department_name,
                CONCAT('HK', h.hocky, ' - ', h.nam) AS semester_name,
                cl.ms_cvht AS cvht_id,
                cv.hoten AS cvht_name
             FROM sinhvien s
             LEFT JOIN sinhvien_lop sl ON s.mssv = sl.mssv AND sl.ms_hocky = ?
             LEFT JOIN lop l ON sl.mslop = l.mslop
             LEFT JOIN khoa k ON l.ms_khoa = k.ms_khoa
             LEFT JOIN hocky h ON sl.ms_hocky = h.ms_hocky
             LEFT JOIN cvht_lop cl ON l.mslop = cl.mslop AND cl.ms_hocky = sl.ms_hocky
             LEFT JOIN cvht cv ON cl.ms_cvht = cv.ms_cvht
             WHERE s.mssv = ?`,
            [semesterId, mssv]
        );
        
        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Student not found'
            });
        }
        
        // Get student's class history (all semesters - not filtered)
        const [history] = await db.query(
            `SELECT 
                sl.mslop,
                sl.ms_hocky,
                CONCAT('HK', h.hocky, ' - ', h.nam) AS semester_name,
                l.ms_khoa,
                k.ten_khoa AS department_name,
                sl.created_at AS assigned_date,
                cl.ms_cvht AS cvht_id,
                cv.hoten AS cvht_name
             FROM sinhvien_lop sl
             LEFT JOIN lop l ON sl.mslop = l.mslop
             LEFT JOIN khoa k ON l.ms_khoa = k.ms_khoa
             LEFT JOIN hocky h ON sl.ms_hocky = h.ms_hocky
             LEFT JOIN cvht_lop cl ON l.mslop = cl.mslop AND cl.ms_hocky = sl.ms_hocky
             LEFT JOIN cvht cv ON cl.ms_cvht = cv.ms_cvht
             WHERE sl.mssv = ?
             ORDER BY h.nam DESC, h.hocky DESC`,
            [mssv]
        );
        
        // Get all semesters for dropdown
        const [allSemesters] = await db.query(
            `SELECT ms_hocky, CONCAT('HK', hocky, ' - ', nam) AS display_name 
             FROM hocky 
             ORDER BY nam DESC, hocky DESC`
        );
        
        res.json({
            success: true,
            data: {
                ...results[0],
                class_history: history
            },
            current_semester: semester,
            all_semesters: allSemesters
        });
    } catch (err) {
        console.error('Error in getStudentByMssv:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
},

// ========== GET ALL STUDENTS BY SEMESTER (convenience method) ==========
getStudentsBySemester: async (req, res) => {
    const { ms_hocky } = req.params;
    
    try {
        // Verify semester exists
        const semester = await staffController.getSemesterById(ms_hocky);
        if (!semester) {
            return res.status(404).json({
                success: false,
                error: 'Semester not found'
            });
        }

        const [results] = await db.query(
            `SELECT 
                s.mssv, 
                s.username, 
                s.hoten, 
                 
                s.created_at, 
                s.valid_until,
                sl.mslop AS current_class,
                sl.ms_hocky AS current_semester_id,
                l.ms_khoa AS department_id,
                k.ten_khoa AS department_name,
                CONCAT('HK', h.hocky, ' - ', h.nam) AS semester_name,
                cl.ms_cvht AS cvht_id,
                cv.hoten AS cvht_name
             FROM sinhvien s
             INNER JOIN sinhvien_lop sl ON s.mssv = sl.mssv AND sl.ms_hocky = ?
             LEFT JOIN lop l ON sl.mslop = l.mslop
             LEFT JOIN khoa k ON l.ms_khoa = k.ms_khoa
             LEFT JOIN hocky h ON sl.ms_hocky = h.ms_hocky
             LEFT JOIN cvht_lop cl ON l.mslop = cl.mslop AND cl.ms_hocky = sl.ms_hocky
             LEFT JOIN cvht cv ON cl.ms_cvht = cv.ms_cvht
             ORDER BY s.hoten ASC`,
            [ms_hocky]
        );
        
        // Get all semesters for dropdown
        const [allSemesters] = await db.query(
            `SELECT ms_hocky, CONCAT('HK', hocky, ' - ', nam) AS display_name 
             FROM hocky 
             ORDER BY nam DESC, hocky DESC`
        );
        
        res.json({
            success: true,
            data: results,
            count: results.length,
            current_semester: semester,
            all_semesters: allSemesters
        });
    } catch (err) {
        console.error('Error in getStudentsBySemester:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
},

// ========== GET ALL STUDENTS BY DEPARTMENT AND SEMESTER ==========
getStudentsByDepartmentAndSemester: async (req, res) => {
    const { ms_khoa, ms_hocky } = req.params;
    
    try {
        // Verify semester exists
        const semester = await staffController.getSemesterById(ms_hocky);
        if (!semester) {
            return res.status(404).json({
                success: false,
                error: 'Semester not found'
            });
        }
        
        // Verify department exists
        const [department] = await db.query(
            "SELECT ms_khoa, ten_khoa FROM khoa WHERE ms_khoa = ?",
            [ms_khoa]
        );
        
        if (department.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Department not found'
            });
        }

        const [results] = await db.query(
            `SELECT 
                s.mssv, 
                s.username, 
                s.hoten, 
                 
                s.created_at, 
                s.valid_until,
                sl.mslop AS current_class,
                sl.ms_hocky AS current_semester_id,
                l.ms_khoa AS department_id,
                k.ten_khoa AS department_name,
                CONCAT('HK', h.hocky, ' - ', h.nam) AS semester_name,
                cl.ms_cvht AS cvht_id,
                cv.hoten AS cvht_name
             FROM sinhvien s
             INNER JOIN sinhvien_lop sl ON s.mssv = sl.mssv AND sl.ms_hocky = ?
             INNER JOIN lop l ON sl.mslop = l.mslop
             INNER JOIN khoa k ON l.ms_khoa = k.ms_khoa
             INNER JOIN hocky h ON sl.ms_hocky = h.ms_hocky
             LEFT JOIN cvht_lop cl ON l.mslop = cl.mslop AND cl.ms_hocky = sl.ms_hocky
             LEFT JOIN cvht cv ON cl.ms_cvht = cv.ms_cvht
             WHERE l.ms_khoa = ?
             ORDER BY s.hoten ASC`,
            [ms_hocky, ms_khoa]
        );
        
        res.json({
            success: true,
            data: results,
            count: results.length,
            current_semester: semester,
            department: department[0]
        });
    } catch (err) {
        console.error('Error in getStudentsByDepartmentAndSemester:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
},

// ========== GET STUDENTS BY CLASS AND SEMESTER ==========
getStudentsByClassAndSemester: async (req, res) => {
    const { mslop, ms_hocky } = req.params;
    
    try {
        // Verify semester exists
        const semester = await staffController.getSemesterById(ms_hocky);
        if (!semester) {
            return res.status(404).json({
                success: false,
                error: 'Semester not found'
            });
        }

        const [results] = await db.query(
            `SELECT 
                s.mssv, 
                s.username, 
                s.hoten, 
                
                s.created_at, 
                s.valid_until,
                sl.mslop AS current_class,
                sl.ms_hocky AS current_semester_id,
                l.ms_khoa AS department_id,
                k.ten_khoa AS department_name,
                CONCAT('HK', h.hocky, ' - ', h.nam) AS semester_name,
                cl.ms_cvht AS cvht_id,
                cv.hoten AS cvht_name
             FROM sinhvien s
             INNER JOIN sinhvien_lop sl ON s.mssv = sl.mssv AND sl.ms_hocky = ?
             INNER JOIN lop l ON sl.mslop = l.mslop
             INNER JOIN khoa k ON l.ms_khoa = k.ms_khoa
             INNER JOIN hocky h ON sl.ms_hocky = h.ms_hocky
             LEFT JOIN cvht_lop cl ON l.mslop = cl.mslop AND cl.ms_hocky = sl.ms_hocky
             LEFT JOIN cvht cv ON cl.ms_cvht = cv.ms_cvht
             WHERE sl.mslop = ? AND sl.ms_hocky = ?
             ORDER BY s.hoten ASC`,
            [ms_hocky, mslop, ms_hocky]
        );
        
        res.json({
            success: true,
            data: results,
            count: results.length,
            semester: semester,
            class: mslop
        });
    } catch (err) {
        console.error('Error in getStudentsByClassAndSemester:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
},


// ========== DELETE STUDENT ==========
deleteStudent: async (req, res) => {
    const { mssv } = req.params;
    
    try {
        // Check if student exists
        const [student] = await db.query(
            "SELECT * FROM sinhvien WHERE mssv = ?",
            [mssv]
        );
        
        if (student.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Student not found'
            });
        }
        
        // Delete student
        await db.query(
            "DELETE FROM sinhvien WHERE mssv = ?",
            [mssv]
        );
        
        res.json({
            success: true,
            message: 'Student deleted successfully'
        });
    } catch (err) {
        console.error('Error in deleteStudent:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
},

// ========== DROPDOWN: GET ALL DEPARTMENTS ==========
getAllDepartments: async (req, res) => {
    try {
        const [results] = await db.query(
            `SELECT ms_khoa, ten_khoa 
             FROM khoa 
             ORDER BY ten_khoa ASC`
        );
        
        res.json({
            success: true,
            data: results,
            count: results.length
        });
    } catch (err) {
        console.error('Error in getAllDepartments:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
},

// ========== DROPDOWN: GET CLASSES BY DEPARTMENT ==========
getClassesByDepartment: async (req, res) => {
    const { ms_khoa } = req.params;
    const { ms_hocky } = req.query; // Get semester from query parameter
    
    try {
        // Get current semester if not specified
        let semesterId = ms_hocky;
        if (!semesterId) {
            const semester = await staffController.getLatestSemester();
            if (semester) {
                semesterId = semester.ms_hocky;
            }
        }
        
        let query = `
            SELECT l.mslop, l.ms_khoa, k.ten_khoa,
                   COUNT(sl.mssv) AS student_count
            FROM lop l
            LEFT JOIN khoa k ON l.ms_khoa = k.ms_khoa
            LEFT JOIN sinhvien_lop sl ON l.mslop = sl.mslop AND sl.ms_hocky = ?
            WHERE l.ms_khoa = ?
            GROUP BY l.mslop, l.ms_khoa, k.ten_khoa
            ORDER BY l.mslop ASC
        `;
        
        let params = [semesterId, ms_khoa];
        
        // If no semester, just get classes without student count
        if (!semesterId) {
            query = `
                SELECT l.mslop, l.ms_khoa, k.ten_khoa, 0 AS student_count
                FROM lop l
                LEFT JOIN khoa k ON l.ms_khoa = k.ms_khoa
                WHERE l.ms_khoa = ?
                ORDER BY l.mslop ASC
            `;
            params = [ms_khoa];
        }
        
        const [results] = await db.query(query, params);
        
        res.json({
            success: true,
            data: results,
            count: results.length
        });
    } catch (err) {
        console.error('Error in getClassesByDepartment:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
},

// ========== DROPDOWN: GET ALL CLASSES ==========
getAllClasses: async (req, res) => {
    try {
        const [results] = await db.query(
            `SELECT l.mslop, l.ms_khoa, k.ten_khoa
             FROM lop l
             LEFT JOIN khoa k ON l.ms_khoa = k.ms_khoa
             ORDER BY l.mslop ASC`
        );
        
        res.json({
            success: true,
            data: results,
            count: results.length
        });
    } catch (err) {
        console.error('Error in getAllClasses:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
},

// ========== SEARCH STUDENTS (with semester parameter) ==========
searchStudents: async (req, res) => {
    const { keyword, ms_hocky } = req.query;
    
    if (!keyword || keyword.trim() === '') {
        return res.status(400).json({
            success: false,
            error: 'Search keyword is required'
        });
    }
    
    try {
        let semester;
        let semesterId;
        
        if (ms_hocky) {
            // Use specified semester
            semester = await staffController.getSemesterById(ms_hocky);
            if (!semester) {
                return res.status(404).json({
                    success: false,
                    error: 'Semester not found'
                });
            }
            semesterId = ms_hocky;
        } else {
            // Use latest semester if not specified
            semester = await staffController.getLatestSemester();
            if (!semester) {
                return res.status(404).json({
                    success: false,
                    error: 'No semester found'
                });
            }
            semesterId = semester.ms_hocky;
        }
        
        const searchTerm = `%${keyword.trim()}%`;
        const [results] = await db.query(
            `SELECT 
                s.mssv, 
                s.username, 
                s.hoten, 
                 
                s.created_at, 
                s.valid_until,
                sl.mslop AS current_class,
                sl.ms_hocky AS current_semester_id,
                l.ms_khoa AS department_id,
                k.ten_khoa AS department_name,
                CONCAT('HK', h.hocky, ' - ', h.nam) AS semester_name,
                cl.ms_cvht AS cvht_id,
                cv.hoten AS cvht_name
             FROM sinhvien s
             LEFT JOIN sinhvien_lop sl ON s.mssv = sl.mssv AND sl.ms_hocky = ?
             LEFT JOIN lop l ON sl.mslop = l.mslop
             LEFT JOIN khoa k ON l.ms_khoa = k.ms_khoa
             LEFT JOIN hocky h ON sl.ms_hocky = h.ms_hocky
             LEFT JOIN cvht_lop cl ON l.mslop = cl.mslop AND cl.ms_hocky = sl.ms_hocky
             LEFT JOIN cvht cv ON cl.ms_cvht = cv.ms_cvht
             WHERE s.mssv LIKE ? 
                OR s.hoten LIKE ? 
                OR s.username LIKE ?
                OR sl.mslop LIKE ?
             ORDER BY s.hoten ASC`,
            [semesterId, searchTerm, searchTerm, searchTerm, searchTerm]
        );
        
        // Get all semesters for dropdown
        const [allSemesters] = await db.query(
            `SELECT ms_hocky, CONCAT('HK', hocky, ' - ', nam) AS display_name 
             FROM hocky 
             ORDER BY nam DESC, hocky DESC`
        );
        
        res.json({
            success: true,
            data: results,
            count: results.length,
            current_semester: semester,
            all_semesters: allSemesters,
            search_keyword: keyword.trim()
        });
    } catch (err) {
        console.error('Error in searchStudents:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
},


// GET all danhmuc
getAllDanhmuc: async (req, res) => {
    try {
        const [results] = await db.query(
            `SELECT ms_danhmuc, ten_danhmuc, diem_danhmuc 
             FROM danhmuc 
             ORDER BY ten_danhmuc ASC`
        );
        
        res.json({
            success: true,
            data: results,
            count: results.length
        });
    } catch (err) {
        console.error('Error in getAllDanhmuc:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
},

// GET danhmuc by ID
getDanhmucById: async (req, res) => {
    const { ms_danhmuc } = req.params;
    
    try {
        const [results] = await db.query(
            `SELECT ms_danhmuc, ten_danhmuc, diem_danhmuc 
             FROM danhmuc 
             WHERE ms_danhmuc = ?`,
            [ms_danhmuc]
        );
        
        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Category not found'
            });
        }
        
        res.json({
            success: true,
            data: results[0]
        });
    } catch (err) {
        console.error('Error in getDanhmucById:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
},

// ========== LOAI (Type) CRUD ==========

// GET all loai
getAllLoai: async (req, res) => {
    try {
        const [results] = await db.query(
            `SELECT l.ms_loai, l.ten_loai, l.diem_tong, l.ms_danhmuc,
                    d.ten_danhmuc, d.diem_danhmuc
             FROM loai l
             LEFT JOIN danhmuc d ON l.ms_danhmuc = d.ms_danhmuc
             ORDER BY l.ten_loai ASC`
        );
        
        res.json({
            success: true,
            data: results,
            count: results.length
        });
    } catch (err) {
        console.error('Error in getAllLoai:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
},

// GET loai by ID
getLoaiById: async (req, res) => {
    const { ms_loai } = req.params;
    
    try {
        const [results] = await db.query(
            `SELECT l.ms_loai, l.ten_loai, l.diem_tong, l.ms_danhmuc,
                    d.ten_danhmuc, d.diem_danhmuc
             FROM loai l
             LEFT JOIN danhmuc d ON l.ms_danhmuc = d.ms_danhmuc
             WHERE l.ms_loai = ?`,
            [ms_loai]
        );
        
        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Type not found'
            });
        }
        
        res.json({
            success: true,
            data: results[0]
        });
    } catch (err) {
        console.error('Error in getLoaiById:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
},

// GET loai by danhmuc
getLoaiByDanhmuc: async (req, res) => {
    const { ms_danhmuc } = req.params;
    
    try {
        // Check if danhmuc exists
        const [danhmuc] = await db.query(
            "SELECT ms_danhmuc, ten_danhmuc FROM danhmuc WHERE ms_danhmuc = ?",
            [ms_danhmuc]
        );
        
        if (danhmuc.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Category not found'
            });
        }
        
        const [results] = await db.query(
            `SELECT l.ms_loai, l.ten_loai, l.diem_tong, l.ms_danhmuc,
                    d.ten_danhmuc
             FROM loai l
             LEFT JOIN danhmuc d ON l.ms_danhmuc = d.ms_danhmuc
             WHERE l.ms_danhmuc = ?
             ORDER BY l.ten_loai ASC`,
            [ms_danhmuc]
        );
        
        res.json({
            success: true,
            data: {
                danhmuc: danhmuc[0],
                loai_list: results,
                count: results.length
            }
        });
    } catch (err) {
        console.error('Error in getLoaiByDanhmuc:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
},

// ========== TIEUCHI (Criteria) CRUD ==========

// GET all tieuchi
getAllTieuchi: async (req, res) => {
    try {
        const [results] = await db.query(
            `SELECT t.mstc, t.ten_tieuchi, t.diem, t.ms_loai,
                    l.ten_loai, l.diem_tong,
                    d.ms_danhmuc, d.ten_danhmuc
             FROM tieuchi t
             LEFT JOIN loai l ON t.ms_loai = l.ms_loai
             LEFT JOIN danhmuc d ON l.ms_danhmuc = d.ms_danhmuc
             ORDER BY d.ten_danhmuc ASC, l.ten_loai ASC, t.ten_tieuchi ASC`
        );
        
        res.json({
            success: true,
            data: results,
            count: results.length
        });
    } catch (err) {
        console.error('Error in getAllTieuchi:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
},

// GET tieuchi by ID
getTieuchiById: async (req, res) => {
    const { mstc } = req.params;
    
    try {
        const [results] = await db.query(
            `SELECT t.mstc, t.ten_tieuchi, t.diem, t.ms_loai,
                    l.ten_loai, l.diem_tong,
                    d.ms_danhmuc, d.ten_danhmuc
             FROM tieuchi t
             LEFT JOIN loai l ON t.ms_loai = l.ms_loai
             LEFT JOIN danhmuc d ON l.ms_danhmuc = d.ms_danhmuc
             WHERE t.mstc = ?`,
            [mstc]
        );
        
        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Criteria not found'
            });
        }
        
        res.json({
            success: true,
            data: results[0]
        });
    } catch (err) {
        console.error('Error in getTieuchiById:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
},

// GET tieuchi by loai
getTieuchiByLoai: async (req, res) => {
    const { ms_loai } = req.params;
    
    try {
        // Check if loai exists
        const [loai] = await db.query(
            `SELECT l.ms_loai, l.ten_loai, l.diem_tong, l.ms_danhmuc,
                    d.ten_danhmuc
             FROM loai l
             LEFT JOIN danhmuc d ON l.ms_danhmuc = d.ms_danhmuc
             WHERE l.ms_loai = ?`,
            [ms_loai]
        );
        
        if (loai.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Type not found'
            });
        }
        
        const [results] = await db.query(
            `SELECT t.mstc, t.ten_tieuchi, t.diem, t.ms_loai
             FROM tieuchi t
             WHERE t.ms_loai = ?
             ORDER BY t.ten_tieuchi ASC`,
            [ms_loai]
        );
        
        res.json({
            success: true,
            data: {
                loai: loai[0],
                tieuchi_list: results,
                count: results.length
            }
        });
    } catch (err) {
        console.error('Error in getTieuchiByLoai:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
},

// GET tieuchi by danhmuc (nested: danhmuc -> loai -> tieuchi)
getTieuchiByDanhmuc: async (req, res) => {
    const { ms_danhmuc } = req.params;
    
    try {
        // Check if danhmuc exists
        const [danhmuc] = await db.query(
            "SELECT ms_danhmuc, ten_danhmuc, diem_danhmuc FROM danhmuc WHERE ms_danhmuc = ?",
            [ms_danhmuc]
        );
        
        if (danhmuc.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Category not found'
            });
        }
        
        // Get all loai for this danhmuc with their tieuchi
        const [results] = await db.query(
            `SELECT 
                l.ms_loai,
                l.ten_loai,
                l.diem_tong,
                JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'mstc', t.mstc,
                        'ten_tieuchi', t.ten_tieuchi,
                        'diem', t.diem
                    )
                ) AS tieuchi_list
             FROM loai l
             LEFT JOIN tieuchi t ON l.ms_loai = t.ms_loai
             WHERE l.ms_danhmuc = ?
             GROUP BY l.ms_loai, l.ten_loai, l.diem_tong
             ORDER BY l.ten_loai ASC`,
            [ms_danhmuc]
        );
        
        // Format the response - safely handle tieuchi_list
        const formattedResults = results.map(row => {
            // Handle null tieuchi_list
            if (row.tieuchi_list === null) {
                return {
                    ...row,
                    tieuchi_list: []
                };
            }
            
            // If already an object, use directly
            if (typeof row.tieuchi_list === 'object') {
                return {
                    ...row,
                    tieuchi_list: row.tieuchi_list
                };
            }
            
            // Try to parse as JSON
            try {
                return {
                    ...row,
                    tieuchi_list: JSON.parse(row.tieuchi_list)
                };
            } catch (parseErr) {
                console.warn('Failed to parse tieuchi_list for loai:', row.ms_loai, parseErr);
                return {
                    ...row,
                    tieuchi_list: []
                };
            }
        });
        
        res.json({
            success: true,
            data: {
                danhmuc: danhmuc[0],
                loai_list: formattedResults,
                count: formattedResults.length
            }
        });
    } catch (err) {
        console.error('Error in getTieuchiByDanhmuc:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
},

// GET full hierarchy: all danhmuc with their loai and tieuchi
getFullHierarchy: async (req, res) => {
    try {
        // Get all danhmuc - sorted by ms_danhmuc
        const [danhmucs] = await db.query(
            `SELECT ms_danhmuc, ten_danhmuc, diem_danhmuc 
             FROM danhmuc 
             ORDER BY ms_danhmuc ASC`  // ← Sort by ID to maintain order
        );
        
        const result = [];
        for (const danhmuc of danhmucs) {
            // Get all loai for this danhmuc - sorted by ms_loai
            const [loais] = await db.query(
                `SELECT 
                    l.ms_loai,
                    l.ten_loai,
                    l.diem_tong,
                    JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'mstc', t.mstc,
                            'ten_tieuchi', t.ten_tieuchi,
                            'diem', t.diem
                        )
                    ) AS tieuchi_list
                 FROM loai l
                 LEFT JOIN tieuchi t ON l.ms_loai = t.ms_loai
                 WHERE l.ms_danhmuc = ?
                 GROUP BY l.ms_loai, l.ten_loai, l.diem_tong
                 ORDER BY l.ms_loai ASC`,  // ← Sort by ID to maintain order
                [danhmuc.ms_danhmuc]
            );
            
            // Format loai data
            const formattedLoais = loais.map(row => {
                if (row.tieuchi_list === null) {
                    return { ...row, tieuchi_list: [] };
                }
                if (typeof row.tieuchi_list === 'object') {
                    return { ...row, tieuchi_list: row.tieuchi_list };
                }
                try {
                    return { ...row, tieuchi_list: JSON.parse(row.tieuchi_list) };
                } catch (parseErr) {
                    console.warn('Failed to parse tieuchi_list for loai:', row.ms_loai, parseErr);
                    return { ...row, tieuchi_list: [] };
                }
            });
            
            // Sort tieuchi within each loai by ms_loai
            formattedLoais.forEach(loai => {
                if (loai.tieuchi_list && Array.isArray(loai.tieuchi_list)) {
                    loai.tieuchi_list.sort((a, b) => a.mstc - b.mstc);
                }
            });
            
            result.push({
                ...danhmuc,
                loai_list: formattedLoais
            });
        }
        
        res.json({
            success: true,
            data: result,
            count: result.length
        });
    } catch (err) {
        console.error('Error in getFullHierarchy:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
},

// GET class by ID
getLopById: async (req, res) => {
    const { mslop } = req.params;
    
    try {
        const [results] = await db.query(
            `SELECT l.mslop, l.ms_khoa, k.ten_khoa
             FROM lop l
             LEFT JOIN khoa k ON l.ms_khoa = k.ms_khoa
             WHERE l.mslop = ?`,
            [mslop]
        );
        
        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Class not found'
            });
        }
        
        res.json({
            success: true,
            data: results[0]
        });
    } catch (err) {
        console.error('Error in getLopById:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
},

// CREATE new class
createLop: async (req, res) => {
    const { mslop, ms_khoa } = req.body;
    
    // Validate required fields
    if (!mslop || !ms_khoa) {
        return res.status(400).json({
            success: false,
            error: 'Required fields: mslop, ms_khoa'
        });
    }
    
    try {
        // Check if class already exists
        const [existingLop] = await db.query(
            "SELECT mslop FROM lop WHERE mslop = ?",
            [mslop]
        );
        
        if (existingLop.length > 0) {
            return res.status(409).json({
                success: false,
                error: 'Class already exists'
            });
        }
        
        // Check if department exists
        const [khoa] = await db.query(
            "SELECT ms_khoa, ten_khoa FROM khoa WHERE ms_khoa = ?",
            [ms_khoa]
        );
        
        if (khoa.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Department not found'
            });
        }
        
        // Insert new class
        await db.query(
            "INSERT INTO lop (mslop, ms_khoa) VALUES (?, ?)",
            [mslop, ms_khoa]
        );
        
        // Get the created class
        const [newLop] = await db.query(
            `SELECT l.mslop, l.ms_khoa, k.ten_khoa
             FROM lop l
             LEFT JOIN khoa k ON l.ms_khoa = k.ms_khoa
             WHERE l.mslop = ?`,
            [mslop]
        );
        
        res.status(201).json({
            success: true,
            message: 'Class created successfully',
            data: newLop[0]
        });
    } catch (err) {
        console.error('Error in createLop:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
},

// UPDATE class
updateLop: async (req, res) => {
    const { mslop } = req.params;
    const { ms_khoa } = req.body;
    
    // Validate required fields
    if (!ms_khoa) {
        return res.status(400).json({
            success: false,
            error: 'Required field: ms_khoa'
        });
    }
    
    try {
        // Check if class exists
        const [existingLop] = await db.query(
            "SELECT * FROM lop WHERE mslop = ?",
            [mslop]
        );
        
        if (existingLop.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Class not found'
            });
        }
        
        // Check if department exists
        const [khoa] = await db.query(
            "SELECT ms_khoa, ten_khoa FROM khoa WHERE ms_khoa = ?",
            [ms_khoa]
        );
        
        if (khoa.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Department not found'
            });
        }
        
        // Update class
        await db.query(
            "UPDATE lop SET ms_khoa = ? WHERE mslop = ?",
            [ms_khoa, mslop]
        );
        
        // Get the updated class
        const [updatedLop] = await db.query(
            `SELECT l.mslop, l.ms_khoa, k.ten_khoa
             FROM lop l
             LEFT JOIN khoa k ON l.ms_khoa = k.ms_khoa
             WHERE l.mslop = ?`,
            [mslop]
        );
        
        res.json({
            success: true,
            message: 'Class updated successfully',
            data: updatedLop[0]
        });
    } catch (err) {
        console.error('Error in updateLop:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
},

// DELETE class
deleteLop: async (req, res) => {
    const { mslop } = req.params;
    
    try {
        // Check if class exists
        const [existingLop] = await db.query(
            "SELECT * FROM lop WHERE mslop = ?",
            [mslop]
        );
        
        if (existingLop.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Class not found'
            });
        }
        
        // Check if class has students
        const [students] = await db.query(
            "SELECT COUNT(*) as count FROM sinhvien_lop WHERE mslop = ?",
            [mslop]
        );
        
        if (students[0].count > 0) {
            return res.status(409).json({
                success: false,
                error: `Cannot delete class. ${students[0].count} student(s) are assigned to this class. Please remove students first.`
            });
        }
        
        // Check if class has CVHT assignments
        const [cvhtAssignments] = await db.query(
            "SELECT COUNT(*) as count FROM cvht_lop WHERE mslop = ?",
            [mslop]
        );
        
        if (cvhtAssignments[0].count > 0) {
            return res.status(409).json({
                success: false,
                error: `Cannot delete class. ${cvhtAssignments[0].count} CVHT assignment(s) exist for this class.`
            });
        }
        
        // Delete class
        await db.query(
            "DELETE FROM lop WHERE mslop = ?",
            [mslop]
        );
        
        res.json({
            success: true,
            message: 'Class deleted successfully',
            data: {
                mslop: mslop,
                deleted: true
            }
        });
    } catch (err) {
        console.error('Error in deleteLop:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
},

// GET department by ID
getKhoaById: async (req, res) => {
    const { ms_khoa } = req.params;
    
    try {
        const [results] = await db.query(
            `SELECT ms_khoa, ten_khoa 
             FROM khoa 
             WHERE ms_khoa = ?`,
            [ms_khoa]
        );
        
        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Department not found'
            });
        }
        
        res.json({
            success: true,
            data: results[0]
        });
    } catch (err) {
        console.error('Error in getKhoaById:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
},

// CREATE new department
createKhoa: async (req, res) => {
    const { ms_khoa, ten_khoa } = req.body;
    
    // Validate required fields
    if (!ms_khoa || !ten_khoa) {
        return res.status(400).json({
            success: false,
            error: 'Required fields: ms_khoa, ten_khoa'
        });
    }
    
    try {
        // Check if department already exists
        const [existingKhoa] = await db.query(
            "SELECT ms_khoa FROM khoa WHERE ms_khoa = ?",
            [ms_khoa]
        );
        
        if (existingKhoa.length > 0) {
            return res.status(409).json({
                success: false,
                error: 'Department ID already exists'
            });
        }
        
        // Check if department name already exists
        const [existingName] = await db.query(
            "SELECT ms_khoa FROM khoa WHERE ten_khoa = ?",
            [ten_khoa]
        );
        
        if (existingName.length > 0) {
            return res.status(409).json({
                success: false,
                error: 'Department name already exists'
            });
        }
        
        // Insert new department
        await db.query(
            "INSERT INTO khoa (ms_khoa, ten_khoa) VALUES (?, ?)",
            [ms_khoa, ten_khoa]
        );
        
        // Get the created department
        const [newKhoa] = await db.query(
            "SELECT ms_khoa, ten_khoa FROM khoa WHERE ms_khoa = ?",
            [ms_khoa]
        );
        
        res.status(201).json({
            success: true,
            message: 'Department created successfully',
            data: newKhoa[0]
        });
    } catch (err) {
        console.error('Error in createKhoa:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
},

// UPDATE department
updateKhoa: async (req, res) => {
    const { ms_khoa } = req.params;
    const { ten_khoa } = req.body;
    
    // Validate required fields
    if (!ten_khoa) {
        return res.status(400).json({
            success: false,
            error: 'Required field: ten_khoa'
        });
    }
    
    try {
        // Check if department exists
        const [existingKhoa] = await db.query(
            "SELECT * FROM khoa WHERE ms_khoa = ?",
            [ms_khoa]
        );
        
        if (existingKhoa.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Department not found'
            });
        }
        
        // Check if department name already exists (excluding current)
        const [existingName] = await db.query(
            "SELECT ms_khoa FROM khoa WHERE ten_khoa = ? AND ms_khoa != ?",
            [ten_khoa, ms_khoa]
        );
        
        if (existingName.length > 0) {
            return res.status(409).json({
                success: false,
                error: 'Department name already exists'
            });
        }
        
        // Update department
        await db.query(
            "UPDATE khoa SET ten_khoa = ? WHERE ms_khoa = ?",
            [ten_khoa, ms_khoa]
        );
        
        // Get the updated department
        const [updatedKhoa] = await db.query(
            "SELECT ms_khoa, ten_khoa FROM khoa WHERE ms_khoa = ?",
            [ms_khoa]
        );
        
        res.json({
            success: true,
            message: 'Department updated successfully',
            data: updatedKhoa[0]
        });
    } catch (err) {
        console.error('Error in updateKhoa:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
},

// DELETE department
deleteKhoa: async (req, res) => {
    const { ms_khoa } = req.params;
    
    try {
        // Check if department exists
        const [existingKhoa] = await db.query(
            "SELECT * FROM khoa WHERE ms_khoa = ?",
            [ms_khoa]
        );
        
        if (existingKhoa.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Department not found'
            });
        }
        
        // Check if department has classes
        const [classes] = await db.query(
            "SELECT COUNT(*) as count FROM lop WHERE ms_khoa = ?",
            [ms_khoa]
        );
        
        if (classes[0].count > 0) {
            return res.status(409).json({
                success: false,
                error: `Cannot delete department. ${classes[0].count} class(es) belong to this department. Please reassign or delete classes first.`
            });
        }
        
        // Check if department has CVHT assignments (through lop)
        const [cvhtAssignments] = await db.query(
            `SELECT COUNT(*) as count 
             FROM cvht_lop cl 
             INNER JOIN lop l ON cl.mslop = l.mslop 
             WHERE l.ms_khoa = ?`,
            [ms_khoa]
        );
        
        if (cvhtAssignments[0].count > 0) {
            return res.status(409).json({
                success: false,
                error: `Cannot delete department. ${cvhtAssignments[0].count} CVHT assignment(s) exist for classes in this department.`
            });
        }
        
        // Check if department has students (through lop)
        const [students] = await db.query(
            `SELECT COUNT(*) as count 
             FROM sinhvien_lop sl 
             INNER JOIN lop l ON sl.mslop = l.mslop 
             WHERE l.ms_khoa = ?`,
            [ms_khoa]
        );
        
        if (students[0].count > 0) {
            return res.status(409).json({
                success: false,
                error: `Cannot delete department. ${students[0].count} student(s) are assigned to classes in this department.`
            });
        }
        
        // Delete department
        await db.query(
            "DELETE FROM khoa WHERE ms_khoa = ?",
            [ms_khoa]
        );
        
        res.json({
            success: true,
            message: 'Department deleted successfully',
            data: {
                ms_khoa: ms_khoa,
                deleted: true
            }
        });
    } catch (err) {
        console.error('Error in deleteKhoa:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
},

// GET departments with class counts
getKhoaWithClassCounts: async (req, res) => {
    try {
        const [results] = await db.query(
            `SELECT k.ms_khoa, k.ten_khoa, COUNT(l.mslop) as class_count
             FROM khoa k
             LEFT JOIN lop l ON k.ms_khoa = l.ms_khoa
             GROUP BY k.ms_khoa, k.ten_khoa
             ORDER BY k.ten_khoa ASC`
        );
        
        res.json({
            success: true,
            data: results,
            count: results.length
        });
    } catch (err) {
        console.error('Error in getKhoaWithClassCounts:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
},

// ========== HELPER: Recalculate Danhmuc diem_danhmuc ==========
recalculateDanhmucDiem: async (ms_danhmuc) => {
    try {
        // Calculate sum of diem_tong from all loai in this danhmuc
        const [result] = await db.query(
            `SELECT COALESCE(SUM(diem_tong), 0) as total 
             FROM loai 
             WHERE ms_danhmuc = ?`,
            [ms_danhmuc]
        );
        
        const total = result[0]?.total || 0;
        
        // Update danhmuc
        await db.query(
            "UPDATE danhmuc SET diem_danhmuc = ? WHERE ms_danhmuc = ?",
            [total, ms_danhmuc]
        );
        
        return total;
    } catch (err) {
        console.error('Error in recalculateDanhmucDiem:', err);
        throw err;
    }
},

// ========== HELPER: Recalculate Loai diem_tong ==========
recalculateLoaiDiem: async (ms_loai) => {
    try {
        // Calculate sum of diem from all tieuchi in this loai
        const [result] = await db.query(
            `SELECT COALESCE(SUM(diem), 0) as total 
             FROM tieuchi 
             WHERE ms_loai = ?`,
            [ms_loai]
        );
        
        const total = result[0]?.total || 0;
        
        // Update loai
        await db.query(
            "UPDATE loai SET diem_tong = ? WHERE ms_loai = ?",
            [total, ms_loai]
        );
        
        return total;
    } catch (err) {
        console.error('Error in recalculateLoaiDiem:', err);
        throw err;
    }
},

// ========== DANHMUC CRUD ==========

// CREATE Danhmuc
createDanhmuc: async (req, res) => {
    const { ten_danhmuc } = req.body;
    
    if (!ten_danhmuc) {
        return res.status(400).json({
            success: false,
            error: 'Required field: ten_danhmuc'
        });
    }
    
    try {
        // Check if danhmuc name already exists
        const [existing] = await db.query(
            "SELECT ms_danhmuc FROM danhmuc WHERE ten_danhmuc = ?",
            [ten_danhmuc]
        );
        
        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                error: 'Danhmuc name already exists'
            });
        }
        
        // Insert new danhmuc with diem_danhmuc = 0 (will be updated when loai added)
        const [result] = await db.query(
            "INSERT INTO danhmuc (ten_danhmuc, diem_danhmuc) VALUES (?, 0)",
            [ten_danhmuc]
        );
        
        // Get the created danhmuc
        const [newDanhmuc] = await db.query(
            "SELECT ms_danhmuc, ten_danhmuc, diem_danhmuc FROM danhmuc WHERE ms_danhmuc = ?",
            [result.insertId]
        );
        
        res.status(201).json({
            success: true,
            message: 'Danhmuc created successfully',
            data: newDanhmuc[0]
        });
    } catch (err) {
        console.error('Error in createDanhmuc:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
},

// UPDATE Danhmuc
updateDanhmuc: async (req, res) => {
    const { ms_danhmuc } = req.params;
    const { ten_danhmuc } = req.body;
    
    if (!ten_danhmuc) {
        return res.status(400).json({
            success: false,
            error: 'Required field: ten_danhmuc'
        });
    }
    
    try {
        // Check if danhmuc exists
        const [existing] = await db.query(
            "SELECT * FROM danhmuc WHERE ms_danhmuc = ?",
            [ms_danhmuc]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Danhmuc not found'
            });
        }
        
        // Check if name already exists (excluding current)
        const [nameExists] = await db.query(
            "SELECT ms_danhmuc FROM danhmuc WHERE ten_danhmuc = ? AND ms_danhmuc != ?",
            [ten_danhmuc, ms_danhmuc]
        );
        
        if (nameExists.length > 0) {
            return res.status(409).json({
                success: false,
                error: 'Danhmuc name already exists'
            });
        }
        
        // Update danhmuc
        await db.query(
            "UPDATE danhmuc SET ten_danhmuc = ? WHERE ms_danhmuc = ?",
            [ten_danhmuc, ms_danhmuc]
        );
        
        // Get updated danhmuc
        const [updated] = await db.query(
            "SELECT ms_danhmuc, ten_danhmuc, diem_danhmuc FROM danhmuc WHERE ms_danhmuc = ?",
            [ms_danhmuc]
        );
        
        res.json({
            success: true,
            message: 'Danhmuc updated successfully',
            data: updated[0]
        });
    } catch (err) {
        console.error('Error in updateDanhmuc:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
},

// DELETE Danhmuc
deleteDanhmuc: async (req, res) => {
    const { ms_danhmuc } = req.params;
    
    try {
        // Check if danhmuc exists
        const [existing] = await db.query(
            "SELECT * FROM danhmuc WHERE ms_danhmuc = ?",
            [ms_danhmuc]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Danhmuc not found'
            });
        }
        
        // Check if danhmuc has loai
        const [loaiCount] = await db.query(
            "SELECT COUNT(*) as count FROM loai WHERE ms_danhmuc = ?",
            [ms_danhmuc]
        );
        
        if (loaiCount[0].count > 0) {
            return res.status(409).json({
                success: false,
                error: `Cannot delete danhmuc. ${loaiCount[0].count} loai(s) belong to this danhmuc. Please delete loai first.`
            });
        }
        
        // Delete danhmuc
        await db.query(
            "DELETE FROM danhmuc WHERE ms_danhmuc = ?",
            [ms_danhmuc]
        );
        
        res.json({
            success: true,
            message: 'Danhmuc deleted successfully'
        });
    } catch (err) {
        console.error('Error in deleteDanhmuc:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
},

// ========== LOAI CRUD ==========

// CREATE Loai
createLoai: async (req, res) => {
    const { ten_loai, ms_danhmuc } = req.body;
    
    if (!ten_loai || !ms_danhmuc) {
        return res.status(400).json({
            success: false,
            error: 'Required fields: ten_loai, ms_danhmuc'
        });
    }
    
    try {
        // Check if danhmuc exists
        const [danhmuc] = await db.query(
            "SELECT ms_danhmuc FROM danhmuc WHERE ms_danhmuc = ?",
            [ms_danhmuc]
        );
        
        if (danhmuc.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Danhmuc not found'
            });
        }
        
        // Check if loai name already exists in this danhmuc
        const [existing] = await db.query(
            "SELECT ms_loai FROM loai WHERE ten_loai = ? AND ms_danhmuc = ?",
            [ten_loai, ms_danhmuc]
        );
        
        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                error: 'Loai name already exists in this danhmuc'
            });
        }
        
        // Insert new loai with diem_tong = 0 (will be updated when tieuchi added)
        const [result] = await db.query(
            "INSERT INTO loai (ten_loai, diem_tong, ms_danhmuc) VALUES (?, 0, ?)",
            [ten_loai, ms_danhmuc]
        );
        
        // Recalculate danhmuc diem_danhmuc
        await staffController.recalculateDanhmucDiem(ms_danhmuc);
        
        // Get the created loai
        const [newLoai] = await db.query(
            `SELECT l.ms_loai, l.ten_loai, l.diem_tong, l.ms_danhmuc,
                    d.ten_danhmuc, d.diem_danhmuc
             FROM loai l
             LEFT JOIN danhmuc d ON l.ms_danhmuc = d.ms_danhmuc
             WHERE l.ms_loai = ?`,
            [result.insertId]
        );
        
        res.status(201).json({
            success: true,
            message: 'Loai created successfully',
            data: newLoai[0]
        });
    } catch (err) {
        console.error('Error in createLoai:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
},

// UPDATE Loai
updateLoai: async (req, res) => {
    const { ms_loai } = req.params;
    const { ten_loai, ms_danhmuc } = req.body;
    
    if (!ten_loai) {
        return res.status(400).json({
            success: false,
            error: 'Required field: ten_loai'
        });
    }
    
    try {
        // Check if loai exists
        const [existing] = await db.query(
            "SELECT * FROM loai WHERE ms_loai = ?",
            [ms_loai]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Loai not found'
            });
        }
        
        const oldDanhmuc = existing[0].ms_danhmuc;
        let newDanhmuc = oldDanhmuc;
        
        // If ms_danhmuc is provided, check if it exists
        if (ms_danhmuc) {
            const [danhmuc] = await db.query(
                "SELECT ms_danhmuc FROM danhmuc WHERE ms_danhmuc = ?",
                [ms_danhmuc]
            );
            
            if (danhmuc.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Danhmuc not found'
                });
            }
            newDanhmuc = ms_danhmuc;
        }
        
        // Check if name already exists in the target danhmuc (excluding current)
        const [nameExists] = await db.query(
            "SELECT ms_loai FROM loai WHERE ten_loai = ? AND ms_danhmuc = ? AND ms_loai != ?",
            [ten_loai, newDanhmuc, ms_loai]
        );
        
        if (nameExists.length > 0) {
            return res.status(409).json({
                success: false,
                error: 'Loai name already exists in this danhmuc'
            });
        }
        
        // Update loai
        await db.query(
            "UPDATE loai SET ten_loai = ?, ms_danhmuc = ? WHERE ms_loai = ?",
            [ten_loai, newDanhmuc, ms_loai]
        );
        
        // Recalculate both old and new danhmuc
        await staffController.recalculateDanhmucDiem(oldDanhmuc);
        if (oldDanhmuc !== newDanhmuc) {
            await staffController.recalculateDanhmucDiem(newDanhmuc);
        }
        
        // Get updated loai
        const [updated] = await db.query(
            `SELECT l.ms_loai, l.ten_loai, l.diem_tong, l.ms_danhmuc,
                    d.ten_danhmuc, d.diem_danhmuc
             FROM loai l
             LEFT JOIN danhmuc d ON l.ms_danhmuc = d.ms_danhmuc
             WHERE l.ms_loai = ?`,
            [ms_loai]
        );
        
        res.json({
            success: true,
            message: 'Loai updated successfully',
            data: updated[0]
        });
    } catch (err) {
        console.error('Error in updateLoai:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
},

// DELETE Loai
deleteLoai: async (req, res) => {
    const { ms_loai } = req.params;
    
    try {
        // Check if loai exists
        const [existing] = await db.query(
            "SELECT * FROM loai WHERE ms_loai = ?",
            [ms_loai]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Loai not found'
            });
        }
        
        const ms_danhmuc = existing[0].ms_danhmuc;
        
        // Check if loai has tieuchi
        const [tieuchiCount] = await db.query(
            "SELECT COUNT(*) as count FROM tieuchi WHERE ms_loai = ?",
            [ms_loai]
        );
        
        if (tieuchiCount[0].count > 0) {
            return res.status(409).json({
                success: false,
                error: `Cannot delete loai. ${tieuchiCount[0].count} tieuchi(s) belong to this loai. Please delete tieuchi first.`
            });
        }
        
        // Delete loai
        await db.query(
            "DELETE FROM loai WHERE ms_loai = ?",
            [ms_loai]
        );
        
        // Recalculate danhmuc diem_danhmuc
        await staffController.recalculateDanhmucDiem(ms_danhmuc);
        
        res.json({
            success: true,
            message: 'Loai deleted successfully'
        });
    } catch (err) {
        console.error('Error in deleteLoai:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
},

// ========== TIEUCHI CRUD ==========

// CREATE Tieuchi
createTieuchi: async (req, res) => {
    const { ten_tieuchi, diem, ms_loai } = req.body;
    
    if (!ten_tieuchi || !ms_loai) {
        return res.status(400).json({
            success: false,
            error: 'Required fields: ten_tieuchi, ms_loai'
        });
    }
    
    try {
        // Check if loai exists
        const [loai] = await db.query(
            "SELECT ms_loai, ms_danhmuc FROM loai WHERE ms_loai = ?",
            [ms_loai]
        );
        
        if (loai.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Loai not found'
            });
        }
        
        const diemValue = diem || 0;
        
        // Insert new tieuchi
        const [result] = await db.query(
            "INSERT INTO tieuchi (ten_tieuchi, diem, ms_loai) VALUES (?, ?, ?)",
            [ten_tieuchi, diemValue, ms_loai]
        );
        
        // Recalculate loai diem_tong
        await staffController.recalculateLoaiDiem(ms_loai);
        
        // Recalculate danhmuc diem_danhmuc
        await staffController.recalculateDanhmucDiem(loai[0].ms_danhmuc);
        
        // Get the created tieuchi
        const [newTieuchi] = await db.query(
            `SELECT t.mstc, t.ten_tieuchi, t.diem, t.ms_loai,
                    l.ten_loai, l.diem_tong,
                    d.ms_danhmuc, d.ten_danhmuc
             FROM tieuchi t
             LEFT JOIN loai l ON t.ms_loai = l.ms_loai
             LEFT JOIN danhmuc d ON l.ms_danhmuc = d.ms_danhmuc
             WHERE t.mstc = ?`,
            [result.insertId]
        );
        
        res.status(201).json({
            success: true,
            message: 'Tieuchi created successfully',
            data: newTieuchi[0]
        });
    } catch (err) {
        console.error('Error in createTieuchi:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
},

// UPDATE Tieuchi
updateTieuchi: async (req, res) => {
    const { mstc } = req.params;
    const { ten_tieuchi, diem, ms_loai } = req.body;
    
    if (!ten_tieuchi) {
        return res.status(400).json({
            success: false,
            error: 'Required field: ten_tieuchi'
        });
    }
    
    try {
        // Check if tieuchi exists
        const [existing] = await db.query(
            "SELECT * FROM tieuchi WHERE mstc = ?",
            [mstc]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Tieuchi not found'
            });
        }
        
        const oldLoai = existing[0].ms_loai;
        let newLoai = oldLoai;
        
        // If ms_loai is provided, check if it exists
        if (ms_loai) {
            const [loai] = await db.query(
                "SELECT ms_loai, ms_danhmuc FROM loai WHERE ms_loai = ?",
                [ms_loai]
            );
            
            if (loai.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Loai not found'
                });
            }
            newLoai = ms_loai;
        }
        
        const diemValue = diem !== undefined ? diem : existing[0].diem;
        
        // Update tieuchi
        await db.query(
            "UPDATE tieuchi SET ten_tieuchi = ?, diem = ?, ms_loai = ? WHERE mstc = ?",
            [ten_tieuchi, diemValue, newLoai, mstc]
        );
        
        // Recalculate both old and new loai
        await staffController.recalculateLoaiDiem(oldLoai);
        if (oldLoai !== newLoai) {
            await staffController.recalculateLoaiDiem(newLoai);
        }
        
        // Recalculate danhmuc for both loai
        const [oldLoaiData] = await db.query(
            "SELECT ms_danhmuc FROM loai WHERE ms_loai = ?",
            [oldLoai]
        );
        if (oldLoaiData.length > 0) {
            await staffController.recalculateDanhmucDiem(oldLoaiData[0].ms_danhmuc);
        }
        
        if (ms_loai) {
            const [newLoaiData] = await db.query(
                "SELECT ms_danhmuc FROM loai WHERE ms_loai = ?",
                [newLoai]
            );
            if (newLoaiData.length > 0) {
                await staffController.recalculateDanhmucDiem(newLoaiData[0].ms_danhmuc);
            }
        }
        
        // Get updated tieuchi
        const [updated] = await db.query(
            `SELECT t.mstc, t.ten_tieuchi, t.diem, t.ms_loai,
                    l.ten_loai, l.diem_tong,
                    d.ms_danhmuc, d.ten_danhmuc
             FROM tieuchi t
             LEFT JOIN loai l ON t.ms_loai = l.ms_loai
             LEFT JOIN danhmuc d ON l.ms_danhmuc = d.ms_danhmuc
             WHERE t.mstc = ?`,
            [mstc]
        );
        
        res.json({
            success: true,
            message: 'Tieuchi updated successfully',
            data: updated[0]
        });
    } catch (err) {
        console.error('Error in updateTieuchi:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
},

// DELETE Tieuchi
deleteTieuchi: async (req, res) => {
    const { mstc } = req.params;
    
    try {
        // Check if tieuchi exists and get its loai
        const [existing] = await db.query(
            "SELECT t.*, l.ms_danhmuc FROM tieuchi t LEFT JOIN loai l ON t.ms_loai = l.ms_loai WHERE t.mstc = ?",
            [mstc]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Tieuchi not found'
            });
        }
        
        const ms_loai = existing[0].ms_loai;
        const ms_danhmuc = existing[0].ms_danhmuc;
        
        // Delete tieuchi
        await db.query(
            "DELETE FROM tieuchi WHERE mstc = ?",
            [mstc]
        );
        
        // Recalculate loai diem_tong
        await staffController.recalculateLoaiDiem(ms_loai);
        
        // Recalculate danhmuc diem_danhmuc
        if (ms_danhmuc) {
            await staffController.recalculateDanhmucDiem(ms_danhmuc);
        }
        
        res.json({
            success: true,
            message: 'Tieuchi deleted successfully'
        });
    } catch (err) {
        console.error('Error in deleteTieuchi:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
},


};

module.exports = staffController;