const express = require('express');
const staffController = require('../controller/staff/staff.controller');
const qrController = require('../controller/staff/qr.controller');
const { verifyToken, isStaff } = require('../middleware/verifyToken');
const upload = require('../config/upload')

const router = express.Router();

router.get('/cvht/class-stats', staffController.getClassStatsByCvht);

router.get('/cvht', staffController.getAllCvht);
router.get('/cvht/:ms_cvht', staffController.getCvhtById);
router.delete('/cvht/:ms_cvht', staffController.deleteCvht);

// ========== DROPDOWN ROUTES (MUST COME FIRST) ==========
// Get all departments for dropdown
router.get('/departments', staffController.getAllDepartments);

// Get classes by department for dropdown
router.get('/departments/:ms_khoa/classes', staffController.getClassesByDepartment);

// Get all classes
router.get('/classes', staffController.getAllClasses);

// ========== SEMESTER ROUTES ==========
router.get('/semesters', staffController.getAllSemesters);
router.get('/semesters/current', staffController.getCurrentSemester);
router.get('/semesters/now', staffController.getSemesterNow);
router.get('/semesters/:ms_hocky', staffController.getSemester);



// ========== STUDENT MANAGEMENT ROUTES ==========
// Get all students
router.get('/students', staffController.getAllStudents);

// Search students
router.get('/students/search', staffController.searchStudents);

// Get students by class and semester
router.get('/classes/:mslop/semesters/:ms_hocky/students', staffController.getStudentsByClassAndSemester);

// Get single student
router.get('/students/:mssv', staffController.getStudentByMssv);

// Delete student
router.delete('/students/:mssv', staffController.deleteStudent);

// Get students by semester
router.get('/students/semesters/:ms_hocky', staffController.getStudentsBySemester);

// Get students by department and semester
router.get('/departments/:ms_khoa/semesters/:ms_hocky/students', staffController.getStudentsByDepartmentAndSemester);

router.get('/students/:mssv/current-class', staffController.getCurrentLopForStudent);
router.get('/students/:mssv/is-enrolled', staffController.isStudentEnrolledNow);
// ========== DANHMUC CRUD ROUTES ==========
router.get('/danhmuc', staffController.getAllDanhmuc);
router.get('/danhmuc/:ms_danhmuc', staffController.getDanhmucById);
router.post('/danhmuc', staffController.createDanhmuc);
router.put('/danhmuc/:ms_danhmuc', staffController.updateDanhmuc);
router.delete('/danhmuc/:ms_danhmuc', staffController.deleteDanhmuc);

// ========== LOAI CRUD ROUTES ==========
router.get('/loai', staffController.getAllLoai);
router.get('/loai/:ms_loai', staffController.getLoaiById);
router.get('/danhmuc/:ms_danhmuc/loai', staffController.getLoaiByDanhmuc);
router.post('/loai', staffController.createLoai);
router.put('/loai/:ms_loai', staffController.updateLoai);
router.delete('/loai/:ms_loai', staffController.deleteLoai);

// ========== TIEUCHI CRUD ROUTES ==========
router.get('/tieuchi', staffController.getAllTieuchi);
router.get('/tieuchi/:mstc', staffController.getTieuchiById);
router.get('/loai/:ms_loai/tieuchi', staffController.getTieuchiByLoai);
router.get('/danhmuc/:ms_danhmuc/tieuchi', staffController.getTieuchiByDanhmuc);
router.post('/tieuchi', staffController.createTieuchi);
router.put('/tieuchi/:mstc', staffController.updateTieuchi);
router.delete('/tieuchi/:mstc', staffController.deleteTieuchi);


// ========== FULL HIERARCHY ROUTE ==========
router.get('/hierarchy', staffController.getFullHierarchy);

// Get class by ID
router.get('/lop/:mslop', staffController.getLopById);

// Create new class
router.post('/lop', staffController.createLop);

// Update class
router.put('/lop/:mslop', staffController.updateLop);

// Delete class
router.delete('/lop/:mslop', staffController.deleteLop);


// Get departments with class counts
router.get('/khoa/with-counts', staffController.getKhoaWithClassCounts);

// Get department by ID
router.get('/khoa/:ms_khoa', staffController.getKhoaById);



// Create new department
router.post('/khoa', staffController.createKhoa);

// Update department
router.put('/khoa/:ms_khoa', staffController.updateKhoa);

// Delete department
router.delete('/khoa/:ms_khoa', staffController.deleteKhoa);

// ========== ACTIVITY (HOAT DONG) ROUTES ==========

// Get all activities
router.get('/hoat-dong', staffController.getAllHoatDong);

// Get activity by ID
router.get('/hoat-dong/:mshd', staffController.getHoatDongById);

// Get activities by staff
//router.get('/hoat-dong/staff/:msnv', staffController.getHoatDongByStaff);

// Get activities by department
router.get('/hoat-dong/khoa/:mskhoa', staffController.getHoatDongByKhoa);

// Get activity count by staff
router.get('/hoat-dong/staff/:msnv/count', staffController.getHoatDongCountByStaff);

// Get activity count by department
router.get('/hoat-dong/khoa/:mskhoa/count', staffController.getHoatDongCountByKhoa);

router.post('/hoat-dong', upload.single('img'), staffController.createHoatDong);
router.put('/hoat-dong/:mshd', upload.single('img'), staffController.updateHoatDong);

// Delete activity
router.delete('/hoat-dong/:mshd', staffController.deleteHoatDong);

// ========== QR CODE ROUTES ==========
// Get active activities for QR generation dropdown
router.get('/qr/active-activities', qrController.getActiveActivities);

// Generate QR code
router.post('/qr/generate', qrController.generateQR);

// Get QR codes by activity
router.get('/qr/activity/:mshd', qrController.getQRCodesByActivity);

// Get my generated QR codes
router.get('/qr/my-codes', qrController.getMyQRCodes);

// Revoke QR code
router.put('/qr/:ms_qr/revoke', qrController.revokeQR);



module.exports = router;