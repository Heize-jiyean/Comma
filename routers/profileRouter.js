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

// [GET] 프로필 설정 - 프로필 편집 페이지
router.get('/settings/profileEdit', profileController.profileEditPage);

// [PUT] 프로필 설정 - 프로필 편집 처리
router.put('/settings/profileEdit', profileController.profileEdit);

// [GET] 프로필 설정 - 비밀번호 변경 페이지
router.get('/settings/passwordChange', profileController.passwordChangePage);

// [GET] 프로필 설정 - 회원 탈퇴 페이지
router.get('/settings/accountRemoval', profileController.accountRemovalPage);

// [POST] 프로필 설정 - 회원 탈퇴 처리
router.post('/settings/accountRemoval', profileController.accountRemoval);

// [GET] 환자 감정 차트 페이지 
router.get('/patient/:patientId/emotion-chart', profileController.charts)


module.exports = router;