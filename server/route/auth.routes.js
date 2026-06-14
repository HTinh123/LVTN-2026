
const express = require('express');
const authController = require('../controller/auth/auth.controller');
const { verifyToken, isStudent, isStaff, isAdmin, isCVHT, authorizeRoles } = require('../middleware/verifyToken');

const router = express.Router();


router.post('/login/student', authController.studentLogin);
router.post('/login/staff', authController.staffLogin);
router.post('/login/admin', authController.adminLogin);
router.post('/login/cvht', authController.cvhtLogin);



module.exports = router;