const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");
const chartController = require("../controllers/profileController");



// [GET] 환자 프로필 페이지 반환
router.get('/patient/:patientId', profileController.patientProfilePage);

// [GET] 환자 일기 전체보기
router.get('/patient/:patientId/diaries', profileController.listAllDiaries);

// [GET] 환자 방명록 전체보기
router.get('/patient/:patientId/guestbooks', profileController.listAllGuestbooks);

// [GET] 상담사 프로필 페이지 반환
router.get('/counselor/:counselorId', profileController.counselorProfilePage);


// [GET] 환자 감정 차트 페이지 
router.get('/patient/:patientId/emotion-chart', profileController.charts)


module.exports = router;