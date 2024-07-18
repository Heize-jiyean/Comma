const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");


// [GET] 환자 프로필 페이지 반환
router.get('/patient/:patientNickname', profileController.patientProfilePage);

// [GET] 환자 일기 전체보기
router.get('/patient/:patientNickname/diaries', profileController.listAllDiaries);

// [GET] 환자 방명록 전체보기
router.get('/patient/:patientNickname/guestbooks', profileController.listAllGuestbooks);

// [GET] 상담사 프로필 페이지 반환
router.get('/counselor/:counselorNickname', profileController.counselorProfilePage);


module.exports = router;