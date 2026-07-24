const db = require('../../db');
const crypto = require('crypto');

const qrController = {
  // Get all active activities for QR generation dropdown
  getActiveActivities: async (req, res) => {
    try {
      const now = new Date();
      
      const [activities] = await db.query(
        `SELECT h.mshd, h.ten, h.thoi_gian_bat_dau, h.thoi_gian_ket_thuc, h.diem
         FROM hoat_dong h
         WHERE h.thoi_gian_bat_dau <= ? 
           AND h.thoi_gian_ket_thuc >= ?
         ORDER BY h.thoi_gian_bat_dau ASC`,
        [now, now]
      );
      
      res.json({
        success: true,
        data: activities
      });
    } catch (err) {
      console.error('Error fetching active activities:', err);
      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  },

  // Generate new QR code
  generateQR: async (req, res) => {
    const { mshd, loai_qr, thoi_han_phut } = req.body;
    
    // Get logged-in staff from token
    const nguoi_tao = req.user?.msnv || req.user?.id;
    
    // Validate required fields
    if (!mshd || !loai_qr || !thoi_han_phut) {
      return res.status(400).json({
        success: false,
        error: 'Required fields: mshd, loai_qr, thoi_han_phut'
      });
    }
    
    // Validate loai_qr
    if (!['check_in', 'check_out'].includes(loai_qr)) {
      return res.status(400).json({
        success: false,
        error: 'loai_qr must be check_in or check_out'
      });
    }
    
    // Validate thoi_han_phut
    const allowedDurations = [1, 2, 5, 10, 15, 30, 60, 120];
    if (!allowedDurations.includes(parseInt(thoi_han_phut))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid duration. Allowed values: ' + allowedDurations.join(', ')
      });
    }
    
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Check if activity exists and is active
      const now = new Date();
      const [activity] = await connection.query(
        `SELECT mshd, ten, thoi_gian_bat_dau, thoi_gian_ket_thuc, diem
         FROM hoat_dong 
         WHERE mshd = ?`,
        [mshd]
      );
      
      if (activity.length === 0) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          error: 'Activity not found'
        });
      }
      
      // Check if activity is currently active
      const hoatDong = activity[0];
      const startTime = new Date(hoatDong.thoi_gian_bat_dau);
      const endTime = new Date(hoatDong.thoi_gian_ket_thuc);
      
      if (now < startTime || now > endTime) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          error: 'Activity is not currently active',
          activity_start: hoatDong.thoi_gian_bat_dau,
          activity_end: hoatDong.thoi_gian_ket_thuc
        });
      }
      
      // Check if staff exists
      const [staff] = await connection.query(
        "SELECT msnv, hoten FROM nhanvien WHERE msnv = ?",
        [nguoi_tao]
      );
      
      if (staff.length === 0) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          error: 'Staff not found'
        });
      }
      
      // Generate unique QR token
      const ma_qr = crypto.randomBytes(32).toString('hex');
      
      // Calculate expiration time
      const ngay_tao = new Date();
      const ngay_het_han = new Date(ngay_tao.getTime() + parseInt(thoi_han_phut) * 60000);
      
      // Insert QR code record
      const [result] = await connection.query(
        `INSERT INTO qr_code (mshd, ma_qr, loai_qr, ngay_tao, ngay_het_han, nguoi_tao, trang_thai) 
         VALUES (?, ?, ?, ?, ?, ?, 'active')`,
        [mshd, ma_qr, loai_qr, ngay_tao, ngay_het_han, nguoi_tao]
      );
      
      await connection.commit();
      
      // Build QR content (data encoded in QR)
      const qrContent = {
        ma_qr: ma_qr,
        loai: loai_qr,
        mshd: mshd,
        ten_hd: hoatDong.ten,
        het_han: ngay_het_han.toISOString()
      };
      
      res.status(201).json({
        success: true,
        message: 'QR code generated successfully',
        data: {
          ms_qr: result.insertId,
          ma_qr: ma_qr,
          mshd: mshd,
          ten_hoat_dong: hoatDong.ten,
          loai_qr: loai_qr,
          ngay_tao: ngay_tao,
          ngay_het_han: ngay_het_han,
          thoi_han_phut: parseInt(thoi_han_phut),
          nguoi_tao: nguoi_tao,
          qr_content: JSON.stringify(qrContent), // This will be encoded in QR
          qr_content_object: qrContent
        }
      });
    } catch (err) {
      await connection.rollback();
      console.error('Error generating QR code:', err);
      res.status(500).json({
        success: false,
        error: err.message
      });
    } finally {
      connection.release();
    }
  },

  // Get all QR codes for an activity
  getQRCodesByActivity: async (req, res) => {
    const { mshd } = req.params;
    
    try {
      const [qrCodes] = await db.query(
        `SELECT q.*, h.ten as ten_hoat_dong, n.hoten as ten_nguoi_tao
         FROM qr_code q
         JOIN hoat_dong h ON q.mshd = h.mshd
         LEFT JOIN nhanvien n ON q.nguoi_tao = n.msnv
         WHERE q.mshd = ?
         ORDER BY q.ngay_tao DESC`,
        [mshd]
      );
      
      // Check remaining time for each QR
      const now = new Date();
      const qrCodesWithStatus = qrCodes.map(qr => {
        const expired = new Date(qr.ngay_het_han) < now;
        const remainingSeconds = Math.max(0, (new Date(qr.ngay_het_han) - now) / 1000);
        
        return {
          ...qr,
          is_expired: expired,
          remaining_seconds: Math.floor(remainingSeconds),
          remaining_formatted: expired ? 'Đã hết hạn' : 
            `${Math.floor(remainingSeconds / 60)}:${String(Math.floor(remainingSeconds % 60)).padStart(2, '0')}`
        };
      });
      
      res.json({
        success: true,
        data: qrCodesWithStatus
      });
    } catch (err) {
      console.error('Error fetching QR codes:', err);
      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  },

  // Get all QR codes generated by current staff
  getMyQRCodes: async (req, res) => {
    const nguoi_tao = req.user?.msnv || req.user?.id;
    
    try {
      const [qrCodes] = await db.query(
        `SELECT q.*, h.ten as ten_hoat_dong
         FROM qr_code q
         JOIN hoat_dong h ON q.mshd = h.mshd
         WHERE q.nguoi_tao = ?
         ORDER BY q.ngay_tao DESC
         LIMIT 50`,
        [nguoi_tao]
      );
      
      res.json({
        success: true,
        data: qrCodes
      });
    } catch (err) {
      console.error('Error fetching QR codes:', err);
      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  },

  // Revoke a QR code
  revokeQR: async (req, res) => {
    const { ms_qr } = req.params;
    
    try {
      const [result] = await db.query(
        "UPDATE qr_code SET trang_thai = 'revoked' WHERE ms_qr = ? AND trang_thai = 'active'",
        [ms_qr]
      );
      
      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: 'QR code not found or already revoked/expired'
        });
      }
      
      res.json({
        success: true,
        message: 'QR code revoked successfully'
      });
    } catch (err) {
      console.error('Error revoking QR code:', err);
      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  }
};

module.exports = qrController;
