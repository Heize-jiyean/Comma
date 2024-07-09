const express = require('express');
const router = express.Router();
const diaryController = require('../controllers/diaryController');

router.use(express.json());

router.get('/new', diaryController.new);
router.post('/register', diaryController.register);

router.delete('/:diaryID', diaryController.delete);

module.exports = router;
