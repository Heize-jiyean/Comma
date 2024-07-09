const bcrypt = require('bcrypt');
const UserModel = require('../models/User');

module.exports = {
    // singup페이지 로드
    singupLoad: (req, res) => {
        res.render('login/signup');
    },

    //singup 진행
    singup: async (req, res) => {
        const userData = req.body;
        userData.password = await bcrypt.hash(userData.password, 10); // 비밀번호 해싱
        // gender 값을 변환
        userData.gender = userData.gender === '남' ? 'male' : userData.gender === '여' ? 'female' : '';

        if (userData.role == 'doctor') {
            UserModel.createCounselor(userData);
        } else if (userData.role == 'patient') {
            UserModel.createPatient(userData);
        }

        res.send(200);
    }
};