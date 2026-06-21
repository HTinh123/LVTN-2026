
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



module.exports = router;