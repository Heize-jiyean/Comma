const express = require('express');
const router = express.Router();
const diaryController = require('../controllers/diaryController');

router.use(express.json());

//상담사 메인화면 라우터
router.get('/', diaryController.list);

router.get('/new', diaryController.new);
router.post('/register', diaryController.register);

router.get('/:diaryId', diaryController.view);
router.get('/checkStatus/:diaryId', diaryController.checkStatus);
router.put('/visibility/:diaryId', diaryController.toggleVisibility);

router.delete('/:diaryId', diaryController.delete);

module.exports = router;
