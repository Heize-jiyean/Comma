const express = require('express');
const router = express.Router();
const diaryController = require('../controllers/diaryController');

router.use(express.json());

router.get('/new', diaryController.new);
router.post('/register', diaryController.register);

router.get('/:diaryId', diaryController.view);
router.put('/visibility/:diaryId', diaryController.toggleVisibility);

router.delete('/:diaryId', diaryController.delete);

module.exports = router;
