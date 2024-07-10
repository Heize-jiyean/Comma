const bcrypt = require('bcrypt');
const UserModel = require('../models/User');

module.exports = {
    // singup페이지 로드
    singupLoad: (req, res) => {
        res.render('login/signup');
    },

    // singup 진행
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
    },

    // 이메일 중복 확인
    checkEmail: async (req, res) => {
        const email = req.body.email;

        const patientUser = await UserModel.getPatientByEmail(email);
        const counselorUser = await UserModel.getCounselorByEmail(email);

        if (!patientUser && !counselorUser) {
            return res.status(200).json({ isDuplicate: false });
        } else {
            return res.status(200).json({ isDuplicate: true });
        }
    },

    // 닉네임 중복 확인
    checkNickname: async (req, res) => {
        const nickname = req.body.nickname;
        console.log(nickname);

        const patientUser = await UserModel.getPatientByNickname(nickname);
        const counselorUser = await UserModel.getCounselorByNickname(nickname);

        if (!patientUser && !counselorUser) {
            return res.status(200).json({ isDuplicate: false });
        } else {
            return res.status(200).json({ isDuplicate: true });
        }
    },
};