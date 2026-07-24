const express = require('express');
const studentController = require('../controller/student/student.controller');
const scanController = require('../controller/student/scan.controller');
const { verifyToken, isStudent } = require('../middleware/verifyToken');

const router = express.Router();
// ========== STUDENT SEMESTER ROUTES ==========
router.get('/students/:mssv/semesters', studentController.getStudentSemesters);
// ========== STUDENT SCORES ROUTE ==========
router.get('/students/:mssv/semesters/:ms_hocky/scores', studentController.getStudentScoresBySemester);

// Get department by MSSV (simple)
// router.get('/students/:mssv/department/simple',  studentController.getDepartmentByMssv);

router.get('/khoa/:mssv', studentController.getStudentKhoa);

// ========== QR SCANNING ROUTES ==========
// Scan QR code
router.post('/scan', scanController.scanQR);

// Get scan history
router.get('/scan/history', scanController.getScanHistory);

// Get participation summary
router.get('/scan/summary', scanController.getParticipationSummary);

// Get scan status for a specific activity
router.get('/scan/status/:mshd', scanController.getActivityScanStatus);
module.exports = router;