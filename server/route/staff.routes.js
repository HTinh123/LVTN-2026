const express = require('express');
const staffController = require('../controller/staff/staff.controller');
const { verifyToken, isStaff } = require('../middleware/verifyToken');

const router = express.Router();

router.get('/cvht/class-stats', staffController.getClassStatsByCvht);

router.get('/cvht', staffController.getAllCvht);
router.get('/cvht/:ms_cvht', staffController.getCvhtById);
router.delete('/cvht/:ms_cvht', staffController.deleteCvht);


module.exports = router;