const db = require('../../db');

// controller/student/scan.controller.js


const scanController = {
  // Scan QR code (check-in or check-out)
  scanQR: async (req, res) => {
    // Get student ID from logged-in user
    const mssv = req.user?.mssv || req.user?.id;
    
    const { ma_qr, qr_content } = req.body;
    
    // Parse QR content if provided as string
    let qrData;
    try {
      qrData = typeof qr_content === 'string' ? JSON.parse(qr_content) : qr_content;
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: 'Invalid QR content format'
      });
    }
    
    const qrToken = ma_qr || qrData?.ma_qr;
    
    if (!qrToken) {
      return res.status(400).json({
        success: false,
        error: 'QR code data is required'
      });
    }
    
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // 1. Find and validate QR code
      const [qrRecords] = await connection.query(
        `SELECT q.*, h.ten as ten_hoat_dong, h.diem
         FROM qr_code q
         JOIN hoat_dong h ON q.mshd = h.mshd
         WHERE q.ma_qr = ? AND q.trang_thai = 'active'`,
        [qrToken]
      );
      
      if (qrRecords.length === 0) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          error: 'Mã QR không hợp lệ hoặc đã bị thu hồi'
        });
      }
      
      const qr = qrRecords[0];
      const now = new Date();
      const expiryTime = new Date(qr.ngay_het_han);
      
      // 2. Check expiration - if expired, do nothing
      if (now > expiryTime) {
        // Mark as expired
        await connection.query(
          "UPDATE qr_code SET trang_thai = 'expired' WHERE ms_qr = ?",
          [qr.ms_qr]
        );
        await connection.commit();
        
        return res.status(400).json({
          success: false,
          error: 'Mã QR đã hết hạn'
        });
      }
      
      // 3. Check if student already has THIS type of scan for THIS activity
      // Prevent duplicate check_in or check_out for the same activity
      const [existingScanType] = await connection.query(
        `SELECT dd.* FROM diem_danh dd
         JOIN qr_code q ON dd.ms_qr = q.ms_qr
         WHERE dd.mssv = ? AND q.mshd = ? AND dd.loai_quet = ?`,
        [mssv, qr.mshd, qr.loai_qr]
      );
      
      if (existingScanType.length > 0) {
        await connection.rollback();
        const typeText = qr.loai_qr === 'check_in' ? 'check-in' : 'check-out';
        return res.status(400).json({
          success: false,
          error: `Bạn đã ${typeText} cho hoạt động này rồi`
        });
      }
      
      // 4. Check if student exists
      const [student] = await connection.query(
        "SELECT mssv, hoten FROM sinhvien WHERE mssv = ?",
        [mssv]
      );
      
      if (student.length === 0) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          error: 'Sinh viên không tồn tại'
        });
      }
      
      // 5. Record attendance (only if scanned before expiry)
      const [diemDanhResult] = await connection.query(
        `INSERT INTO diem_danh (mssv, ms_qr, thoi_gian_quet, loai_quet, ghi_chu) 
         VALUES (?, ?, ?, ?, ?)`,
        [mssv, qr.ms_qr, now, qr.loai_qr, null]
      );
      
      // 6. Check if student has BOTH check_in AND check_out for this activity
      // After inserting current record, count how many records for this activity
      const [allScans] = await connection.query(
        `SELECT dd.loai_quet FROM diem_danh dd
         JOIN qr_code q ON dd.ms_qr = q.ms_qr
         WHERE dd.mssv = ? AND q.mshd = ?`,
        [mssv, qr.mshd]
      );
      
      const hasCheckIn = allScans.some(scan => scan.loai_quet === 'check_in');
      const hasCheckOut = allScans.some(scan => scan.loai_quet === 'check_out');
      
      // If both check-in and check-out exist, create/update tham_gia_hoat_dong
      if (hasCheckIn && hasCheckOut) {
        // Get the earliest check_in and latest check_out time
        const [times] = await connection.query(
          `SELECT 
             MIN(CASE WHEN dd.loai_quet = 'check_in' THEN dd.thoi_gian_quet END) as check_in_time,
             MAX(CASE WHEN dd.loai_quet = 'check_out' THEN dd.thoi_gian_quet END) as check_out_time
           FROM diem_danh dd
           JOIN qr_code q ON dd.ms_qr = q.ms_qr
           WHERE dd.mssv = ? AND q.mshd = ?`,
          [mssv, qr.mshd]
        );
        
        const checkInTime = times[0].check_in_time;
        const checkOutTime = times[0].check_out_time;
        
        // Calculate score (full points if both check-in and check-out exist)
        const diemDatDuoc = qr.diem;
        
        // Insert or update tham_gia_hoat_dong
        await connection.query(
          `INSERT INTO tham_gia_hoat_dong (mssv, mshd, check_in, check_out, diem_dat_duoc) 
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE 
             check_in = VALUES(check_in),
             check_out = VALUES(check_out),
             diem_dat_duoc = VALUES(diem_dat_duoc)`,
          [mssv, qr.mshd, checkInTime, checkOutTime, diemDatDuoc]
        );
      }
      
      // Mark QR as used
      await connection.query(
        "UPDATE qr_code SET trang_thai = 'used' WHERE ms_qr = ?",
        [qr.ms_qr]
      );
      
      await connection.commit();
      
      res.json({
        success: true,
        message: qr.loai_qr === 'check_in' ? 'Check-in thành công!' : 'Check-out thành công!',
        data: {
          mssv: mssv,
          hoten: student[0].hoten,
          ten_hoat_dong: qr.ten_hoat_dong,
          loai_quet: qr.loai_qr,
          thoi_gian_quet: now,
          has_completed: hasCheckIn && hasCheckOut,
          diem_dat_duoc: (hasCheckIn && hasCheckOut) ? qr.diem : null
        }
      });
    } catch (err) {
      await connection.rollback();
      
      // Handle duplicate entry error specifically
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
          success: false,
          error: 'Bạn đã quét mã QR này rồi'
        });
      }
      
      console.error('Error scanning QR:', err);
      res.status(500).json({
        success: false,
        error: err.message
      });
    } finally {
      connection.release();
    }
  },

  // Get scan history for current student
  getScanHistory: async (req, res) => {
    const mssv = req.user?.mssv || req.user?.id;
    
    try {
      const [history] = await db.query(
        `SELECT dd.*, h.ten as ten_hoat_dong, h.diem as diem_toi_da,
                q.loai_qr as qr_loai
         FROM diem_danh dd
         JOIN qr_code q ON dd.ms_qr = q.ms_qr
         JOIN hoat_dong h ON q.mshd = h.mshd
         WHERE dd.mssv = ?
         ORDER BY dd.thoi_gian_quet DESC
         LIMIT 50`,
        [mssv]
      );
      
      res.json({
        success: true,
        data: history
      });
    } catch (err) {
      console.error('Error fetching scan history:', err);
      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  },

  // Get participation summary for current student
  getParticipationSummary: async (req, res) => {
    const mssv = req.user?.mssv || req.user?.id;
    
    try {
      const [summary] = await db.query(
        `SELECT tghd.*, h.ten as ten_hoat_dong, h.diem as diem_toi_da,
                h.thoi_gian_bat_dau, h.thoi_gian_ket_thuc
         FROM tham_gia_hoat_dong tghd
         JOIN hoat_dong h ON tghd.mshd = h.mshd
         WHERE tghd.mssv = ?
         ORDER BY h.thoi_gian_bat_dau DESC`,
        [mssv]
      );
      
      const totalDiem = summary.reduce((sum, item) => sum + (item.diem_dat_duoc || 0), 0);
      const completedCount = summary.filter(s => s.check_in && s.check_out).length;
      
      res.json({
        success: true,
        data: {
          activities: summary,
          total_diem: totalDiem,
          total_activities: summary.length,
          completed_activities: completedCount
        }
      });
    } catch (err) {
      console.error('Error fetching participation summary:', err);
      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  },

  // Get student's activity scan status (for showing check-in/check-out buttons)
  getActivityScanStatus: async (req, res) => {
    const mssv = req.user?.mssv || req.user?.id;
    const { mshd } = req.params;
    
    try {
      // Get all scans for this student and activity
      const [scans] = await db.query(
        `SELECT dd.loai_quet, dd.thoi_gian_quet
         FROM diem_danh dd
         JOIN qr_code q ON dd.ms_qr = q.ms_qr
         WHERE dd.mssv = ? AND q.mshd = ?`,
        [mssv, mshd]
      );
      
      const hasCheckIn = scans.some(scan => scan.loai_quet === 'check_in');
      const hasCheckOut = scans.some(scan => scan.loai_quet === 'check_out');
      
      // Get participation record if exists
      const [thamGia] = await db.query(
        "SELECT * FROM tham_gia_hoat_dong WHERE mssv = ? AND mshd = ?",
        [mssv, mshd]
      );
      
      res.json({
        success: true,
        data: {
          mssv: mssv,
          mshd: parseInt(mshd),
          has_check_in: hasCheckIn,
          has_check_out: hasCheckOut,
          is_completed: hasCheckIn && hasCheckOut,
          diem_dat_duoc: thamGia.length > 0 ? thamGia[0].diem_dat_duoc : 0,
          scans: scans,
          tham_gia: thamGia.length > 0 ? thamGia[0] : null
        }
      });
    } catch (err) {
      console.error('Error fetching scan status:', err);
      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  }
};

module.exports = scanController;