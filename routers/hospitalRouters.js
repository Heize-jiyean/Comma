const hospitalController = require('../controllers/hospitalController');
const express = require('express');
const router = express.Router();

console.log('hospitalController:', hospitalController);  // 디버깅을 위해 추가

router.get('/', hospitalController.loadingMainPage);
router.get('/search', hospitalController.getHospitalLocation);
router.get('/autocomplete', hospitalController.getAutoComplete);
router.get('/comment', hospitalController.getCommentByHospital);
router.get('/register', hospitalController.renderRegisterPage);
router.post('/review/submit', hospitalController.submitReview);

module.exports = router;