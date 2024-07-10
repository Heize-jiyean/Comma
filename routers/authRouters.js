const express = require('express');
const authController = require('../controllers/authController');
const router = express.Router();

router.get('/login', (req, res) => {
    res.render('login/login');
});

router.post('/login', (req, res) => {
    // 로그인 로직 구현 (다음 단계에서 처리)
});

router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if(err) {
            console.log(err);
        } else {
            res.redirect('/');
        }
    });
});

router.get('/signup', authController.singupLoad);
router.post('/submit-signup', authController.singup);
router.post('/check-email', authController.checkEmail);
router.post('/check-nickname', authController.checkNickname);

router.get('/')

module.exports = router;