const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');

router.use(express.json());

router.get('/diary', profileController.diary);


module.exports = router;
