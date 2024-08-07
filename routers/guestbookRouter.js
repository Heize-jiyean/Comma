const express = require('express');
const router = express.Router();
const guestbookController = require('../controllers/guestbookController');

router.use(express.json());

// [GET] 방명록 작성 페이지 반환
router.get('/new/:patientId', guestbookController.new);

// [POST] 방명록 작성 처리
router.post('/register/:patientId', guestbookController.register);

// [GET] 방명록 상세조회 
router.get('/:guestbookId', guestbookController.view);

// [GET] 방명록 수정 페이지 반환
router.get('/edit/:guestbookId', guestbookController.edit);

// [PUT] 방명록 수정 처리
router.put('/update/:guestbookId', guestbookController.update);

// [DELETE] 방명록 삭제 
router.delete('/:guestbookId', guestbookController.delete);

// [POST] 방명록 댓글 작성
router.post('/add-comment', guestbookController.addComment);

module.exports = router;  
