const db = require('../../db');

const adminController = {
// ========== GET ALL STAFF MEMBERS ==========
getAllStaff: async (req, res) => {
    try {
        const [results] = await db.query(
            `SELECT msnv, hoten, username, role, created_at 
             FROM nhanvien 
             WHERE role = 0  -- Only get staff members
             ORDER BY created_at DESC`
        );
        
        res.json({
            success: true,
            data: results,
            count: results.length
        });
    } catch (err) {
        console.error('Error in getAllStaff:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
},

// ========== GET SINGLE STAFF BY ID ==========
getStaffById: async (req, res) => {
    const { msnv } = req.params;
    
    try {
        const [results] = await db.query(
            `SELECT msnv, hoten, username, role, created_at 
             FROM nhanvien 
             WHERE msnv = ? AND role = 0`,
            [msnv]
        );
        
        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Staff member not found'
            });
        }
        
        res.json({
            success: true,
            data: results[0]
        });
    } catch (err) {
        console.error('Error in getStaffById:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
},

// ========== DELETE STAFF ==========
deleteStaff: async (req, res) => {
    const { msnv } = req.params;
    
    try {
        // Check if staff exists and is not admin
        const [staff] = await db.query(
            "SELECT * FROM nhanvien WHERE msnv = ? AND role = 0",
            [msnv]
        );
        
        if (staff.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Staff member not found'
            });
        }
        
        // Delete staff
        await db.query(
            "DELETE FROM nhanvien WHERE msnv = ? AND role = 0",
            [msnv]
        );
        
        res.json({
            success: true,
            message: 'Staff member deleted successfully'
        });
    } catch (err) {
        console.error('Error in deleteStaff:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
},

};

module.exports = adminController;