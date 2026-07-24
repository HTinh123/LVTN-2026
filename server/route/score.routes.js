const express = require('express');

const scoreController = require('../controller/score/score.controller');

const router = express.Router();

// Create evaluation
router.post('/danhgia',  scoreController.createDanhgia);
module.exports = router;