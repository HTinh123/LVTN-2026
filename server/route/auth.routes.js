
const express = require('express');
const authController = require('../controller/auth/auth.controller');
const { verifyToken, isStudent, isStaff, isAdmin, isCVHT, authorizeRoles } = require('../middleware/verifyToken');
const upload = require('../config/multer.config'); 

const router = express.Router();



router.post('/login/student', authController.studentLogin);
router.post('/login/staff', authController.staffLogin);
router.post('/login/admin', authController.adminLogin);
router.post('/login/cvht', authController.cvhtLogin);

router.post('/staff/register', authController.registerStaff);
router.post('/staff/:msnv/reset-password', authController.resetStaffPassword);

router.post('/cvht/:ms_cvht/reset-password', authController.resetCvhtPassword);
router.post('/cvht/register', authController.registerCvht);

router.post('/student/register', authController.registerStudent);
router.post('/student/bulk-upload', upload.single('file'), authController.bulkRegisterFromFile);

// Reset student password
router.post('/students/:mssv/reset-password', authController.resetStudentPassword);

// Student change password (self-service)
router.post('/student/:mssv/change-password', verifyToken, authController.changeStudentPassword);

// Staff change password (self-service)
router.post('/staff/:msnv/change-password', verifyToken, authController.changeStaffPassword);

// CVHT change password (self-service)
router.post('/cvht/:ms_cvht/change-password', verifyToken, authController.changeCvhtPassword);

// CVHT edit profile (self-service)
router.put('/cvht/:ms_cvht/profile', verifyToken, authController.editCvhtProfile);

// Staff edit profile (self-service)
router.put('/staff/:msnv/profile', verifyToken, authController.editStaffProfile);

// Admin edit profile (self-service)
router.put('/admin/:msnv/profile', verifyToken, authController.editAdminProfile);


module.exports = router;