const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");


// TODO: 라우팅 다른 것도 제대로 해주기
// 환자 프로필 페이지 반환
router.get('/patient/:patientNickname', profileController.patientProfilePage);

// 상담사 프로필 페이지 반환
router.get('/counselor/:counselorNickname', profileController.counselorProfilePage);

module.exports = router;