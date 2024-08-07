const hospitalController = require('../controllers/hospitalController');
const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../middleware/auth');

console.log('hospitalController:', hospitalController);  // 디버깅을 위해 추가

router.get('/', hospitalController.checkLoginAndLoadPage);
router.get('/search', isLoggedIn, hospitalController.getHospitalLocation);
router.get('/autocomplete', hospitalController.getAutoComplete);
router.get('/comment', isLoggedIn, hospitalController.getCommentByHospital);
router.get('/register', isLoggedIn, hospitalController.renderRegisterPage);
router.post('/review/submit', isLoggedIn, hospitalController.submitReview);
router.delete('/:reviewId', isLoggedIn, hospitalController.deleteReview);

module.exports = router;