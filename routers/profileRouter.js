const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");


// [GET] 환자 프로필 페이지 반환
router.get('/patient/:patientId', profileController.patientProfilePage);

// [GET] 환자 일기 전체보기
router.get('/patient/:patientId/diaries', profileController.listAllDiaries);

// [GET] 환자 방명록 전체보기
router.get('/patient/:patientId/guestbooks', profileController.listAllGuestbooks);

// [GET] 상담사 프로필 페이지 반환
router.get('/counselor/:counselorId', profileController.counselorProfilePage);

// [GET] 상담사 방명록 전체보기 페이지
router.get('/counselor/:counselorId/guestbooks', profileController.listAllGuestbooksByCounselor);

// [GET] 프로필 설정 - 프로필 편집 페이지
router.get('/settings/profileEdit', profileController.profileEditPage);

// [PUT] 프로필 설정 - 프로필 편집 처리 (프로필 이미지)
router.put('/settings/profilePhotoEdit', profileController.profilePhotoEdit);

// [PUT] 프로필 설정 - 프로필 편집 처리 (프로필 정보)
router.put('/settings/profileInfoEdit', profileController.profileInfoEdit);

// [GET] 프로필 설정 - 비밀번호 변경 페이지
router.get('/settings/passwordChange', profileController.passwordChangePage);

// [PUT] 프로필 설정 - 비밀번호 변경 처리
router.put('/settings/passwordChange', profileController.passwordChange);

// [POST] 프로필 설정 - 이메일 인증번호 전송
router.post('/settings/sendEmail', profileController.sendCode);

// [PUT] 프로필 설정 - 비밀번호 잊은 경우, 비밀번호 변경 처리
router.put('/settings/modalPasswordChange', profileController.modalPasswordChange);

// [GET] 프로필 설정 - 회원 탈퇴 페이지
router.get('/settings/accountRemoval', profileController.accountRemovalPage);

// [POST] 프로필 설정 - 회원 탈퇴 처리
router.post('/settings/accountRemoval', profileController.accountRemoval);

// [GET] 환자 감정 차트 페이지 
router.get('/patient/:patientId/emotion-chart', profileController.charts);

// [POST] 관심 환자, 관심 상담사 등록
router.post('/scrap/:targetId', profileController.addScrap);

// [DELETE] 관심 환자, 관심 상담사 해제
router.delete('/scrap/:targetId', profileController.removeScrap);

// [GET] 내가 스크랩한 관심 환자, 관심 상담사
router.get('/scrap/myScraps', profileController.listMyScraps);

// [GET] 나를 스크랩한 관심 환자, 관심 상담사
router.get('/scrap/scrapsOnMe', profileController.listScrapsOnMe);


module.exports = router;