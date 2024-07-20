const hospitalController = require('../controllers/hospitalController');
const express = require('express');
const router = express.Router();

router.get('/', hospitalController.loadingMainPage);
router.get('/search',hospitalController.getHospitalLocation);

router.get('/register', hospitalController.renderRegisterPage);

module.exports = router;