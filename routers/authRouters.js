const express = require('express');
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

module.exports = router;