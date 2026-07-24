const db = require('../../db');
const bcrypt = require('bcryptjs');
const scoreController = {
 // ========== CREATE DANHGIA ==========
    createDanhgia: async (req, res) => {
        const { 
            ms_bangdiem, 
            nguoi_danhgia, 
            nguoi_danhgia_id, 
            nhan_xet,
            diem_tong,
            chitiet_danhgia // Array of { mstc, diem_thucte, batdau, ketthuc, ghi_chu }
        } = req.body;
        
        // Validate required fields
        if (!ms_bangdiem || !nguoi_danhgia || !nguoi_danhgia_id) {
            return res.status(400).json({
                success: false,
                error: 'Required fields: ms_bangdiem, nguoi_danhgia, nguoi_danhgia_id'
            });
        }
        
        // Validate nguoi_danhgia enum
        const validRaters = ['sinhvien', 'cvht', 'nhanvien'];
        if (!validRaters.includes(nguoi_danhgia)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid nguoi_danhgia. Must be: sinhvien, cvht, or nhanvien'
            });
        }
        
        const connection = await db.getConnection();
        
        try {
            await connection.beginTransaction();
            
            // 1. Check if bangdiem exists
            const [bangdiem] = await connection.query(
                `SELECT b.ms_bangdiem, b.mssv, b.ms_hocky, b.diem_tong, b.xeploai,
                        s.hoten as student_name
                 FROM bangdiem b
                 LEFT JOIN sinhvien s ON b.mssv = s.mssv
                 WHERE b.ms_bangdiem = ?`,
                [ms_bangdiem]
            );
            
            if (bangdiem.length === 0) {
                await connection.rollback();
                return res.status(404).json({
                    success: false,
                    error: 'Bangdiem not found'
                });
            }
            
            // 2. Check if evaluation already exists for this rater and bangdiem
            const [existingDanhgia] = await connection.query(
                `SELECT ms_danhgia, trang_thai 
                 FROM danhgia 
                 WHERE ms_bangdiem = ? AND nguoi_danhgia = ?`,
                [ms_bangdiem, nguoi_danhgia]
            );
            
            if (existingDanhgia.length > 0) {
                await connection.rollback();
                return res.status(409).json({
                    success: false,
                    error: `Evaluation already exists for this ${nguoi_danhgia}`,
                    data: existingDanhgia[0]
                });
            }
            
            // 3. If chitiet_danhgia is provided, validate it
            if (chitiet_danhgia && Array.isArray(chitiet_danhgia)) {
                for (const item of chitiet_danhgia) {
                    if (!item.mstc) {
                        await connection.rollback();
                        return res.status(400).json({
                            success: false,
                            error: 'Each chitiet_danhgia must have mstc'
                        });
                    }
                    
                    // Check if tieuchi exists
                    const [tieuchi] = await connection.query(
                        "SELECT mstc, ten_tieuchi, diem FROM tieuchi WHERE mstc = ?",
                        [item.mstc]
                    );
                    
                    if (tieuchi.length === 0) {
                        await connection.rollback();
                        return res.status(404).json({
                            success: false,
                            error: `Tieuchi with mstc ${item.mstc} not found`
                        });
                    }
                }
            }
            
            // 4. Insert danhgia
            const diemTong = diem_tong || 0;
            const trangThai = diemTong > 0 ? 'hoanthanh' : 'nhap';
            
            const [result] = await connection.query(
                `INSERT INTO danhgia 
                 (ms_bangdiem, nguoi_danhgia, nguoi_danhgia_id, diem_tong, nhan_xet, trang_thai) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [ms_bangdiem, nguoi_danhgia, nguoi_danhgia_id, diemTong, nhan_xet || null, trangThai]
            );
            
            const ms_danhgia = result.insertId;
            
            // 5. Insert chitiet_danhgia if provided
            if (chitiet_danhgia && Array.isArray(chitiet_danhgia) && chitiet_danhgia.length > 0) {
                for (const item of chitiet_danhgia) {
                    await connection.query(
                        `INSERT INTO chitiet_danhgia 
                         (ms_danhgia, mstc, diem_thucte, batdau, ketthuc, ghi_chu) 
                         VALUES (?, ?, ?, ?, ?, ?)`,
                        [
                            ms_danhgia,
                            item.mstc,
                            item.diem_thucte || 0,
                            item.batdau || null,
                            item.ketthuc || null,
                            item.ghi_chu || null
                        ]
                    );
                }
            }
            
            await connection.commit();
            
            // 6. Get the created danhgia with details
            const [newDanhgia] = await connection.query(
                `SELECT d.ms_danhgia, d.ms_bangdiem, d.nguoi_danhgia, d.nguoi_danhgia_id,
                        d.diem_tong, d.nhan_xet, d.ngay_danhgia, d.trang_thai,
                        b.mssv, b.ms_hocky,
                        s.hoten as student_name
                 FROM danhgia d
                 LEFT JOIN bangdiem b ON d.ms_bangdiem = b.ms_bangdiem
                 LEFT JOIN sinhvien s ON b.mssv = s.mssv
                 WHERE d.ms_danhgia = ?`,
                [ms_danhgia]
            );
            
            // Get chitiet_danhgia
            const [chitiet] = await connection.query(
                `SELECT cd.ms_ctdg, cd.mstc, cd.diem_thucte, cd.batdau, cd.ketthuc, cd.ghi_chu,
                        t.ten_tieuchi, t.diem as diem_toida
                 FROM chitiet_danhgia cd
                 INNER JOIN tieuchi t ON cd.mstc = t.mstc
                 WHERE cd.ms_danhgia = ?`,
                [ms_danhgia]
            );
            
            res.status(201).json({
                success: true,
                message: 'Evaluation created successfully',
                data: {
                    danhgia: newDanhgia[0],
                    chitiet: chitiet
                }
            });
            
        } catch (err) {
            await connection.rollback();
            console.error('Error in createDanhgia:', err);
            res.status(500).json({ 
                success: false, 
                error: err.message 
            });
        } finally {
            connection.release();
        }
    },


};
module.exports = scoreController;