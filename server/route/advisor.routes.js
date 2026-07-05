const express = require('express');
const advisorController = require('../controller/advisor/advisor.controller');
const { verifyToken, isCVHT } = require('../middleware/verifyToken');

const router = express.Router();

// ========== ADVISOR ROUTES ==========
router.get('/cvht/:ms_cvht/semesters/:ms_hocky/classes',  advisorController.getLopByCvhtAndHocky);

module.exports = router;