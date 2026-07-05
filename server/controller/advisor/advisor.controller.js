const db = require('../../db');

const advisorController = {

 // ========== GET CLASSES BY CVHT AND SEMESTER ==========
    getLopByCvhtAndHocky: async (req, res) => {
        const { ms_cvht, ms_hocky } = req.params;
        
        try {
            // Check if CVHT exists
            const [cvht] = await db.query(
                "SELECT ms_cvht, hoten, username FROM cvht WHERE ms_cvht = ?",
                [ms_cvht]
            );
            
            if (cvht.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'CVHT not found'
                });
            }
            
            // Check if semester exists
            const [hocky] = await db.query(
                `SELECT ms_hocky, hocky, nam, ngay_batdau, ngay_ketthuc,
                        CONCAT('HK', hocky, ' - ', nam) AS display_name
                 FROM hocky 
                 WHERE ms_hocky = ?`,
                [ms_hocky]
            );
            
            if (hocky.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Semester not found'
                });
            }
            
            // Get classes assigned to this CVHT for the specified semester
            const [results] = await db.query(
                `SELECT 
                    cl.ms_cl AS assignment_id,
                    cl.mslop,
                    cl.ms_hocky,
                    cl.created_at AS assigned_date,
                    l.ms_khoa,
                    k.ten_khoa AS department_name,
                    COUNT(DISTINCT sl.mssv) AS student_count,                    
                    GROUP_CONCAT(DISTINCT s.mssv) AS student_ids
                 FROM cvht_lop cl
                 INNER JOIN lop l ON cl.mslop = l.mslop
                 INNER JOIN khoa k ON l.ms_khoa = k.ms_khoa
                 LEFT JOIN sinhvien_lop sl ON l.mslop = sl.mslop AND sl.ms_hocky = cl.ms_hocky
                 LEFT JOIN sinhvien s ON sl.mssv = s.mssv
                 WHERE cl.ms_cvht = ? AND cl.ms_hocky = ?
                 GROUP BY cl.ms_cl, cl.mslop, cl.ms_hocky, cl.created_at, l.ms_khoa, k.ten_khoa
                 ORDER BY l.mslop ASC`,
                [ms_cvht, ms_hocky]
            );
            
            res.json({
                success: true,
                data: {
                    cvht: cvht[0],
                    semester: hocky[0],
                    classes: results,
                    count: results.length
                }
            });
        } catch (err) {
            console.error('Error in getLopByCvhtAndHocky:', err);
            res.status(500).json({ 
                success: false, 
                error: err.message 
            });
        }
    },


};

module.exports = advisorController;