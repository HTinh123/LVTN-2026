const express = require('express');
const adminController = require('../controller/admin/admin.controller');
const { verifyToken, isAdmin } = require('../middleware/verifyToken');

const router = express.Router();

router.get('/staff',  adminController.getAllStaff);
router.get('/staff/:msnv',  adminController.getStaffById);
router.delete('/staff/:msnv',  adminController.deleteStaff);


module.exports = router;