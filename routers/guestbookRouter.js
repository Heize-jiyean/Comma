const express = require('express');
const router = express.Router();
const guestbookController = require('../controllers/guestbookController');

router.use(express.json());

// [GET] 방명록 작성 페이지 반환
router.get('/new', guestbookController.new);

// [POST] 방명록 작성
router.post('/register', guestbookController.register);



module.exports = router;
