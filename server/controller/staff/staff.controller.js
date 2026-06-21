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

    // ========== GET CLASS STATISTICS BY CVHT ==========
getClassStatsByCvht: async (req, res) => {
    try {
        const [results] = await db.query(
            `SELECT 
                c.ms_cvht,
                c.hoten AS name,
                c.username,
                COUNT(l.mslop) AS classCount,
                COALESCE(SUM(l.soluong), 0) AS totalStudents,
                COALESCE(AVG(l.drl_tb), 0) AS avgDrl
             FROM cvht c
             LEFT JOIN lop l ON c.ms_cvht = l.ms_cvht
             GROUP BY c.ms_cvht, c.hoten, c.username
             ORDER BY classCount DESC`
        );
        
        res.json({
            success: true,
            data: results,
            count: results.length
        });
    } catch (err) {
        console.error('Error in getClassStatsByCvht:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
},

};

module.exports = staffController;