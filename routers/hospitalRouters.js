const hospitalController = require('../controllers/hospitalController');
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('hospital/hospital');  // views/hospital/hospital.ejs 파일 렌더링
});

router.get('/register', hospitalController.renderRegisterPage);

module.exports = router;