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
        userData.gender = userData.gender === '남' ? 'male' : userData.gender === '여' ? 'female' : userData.gender === '기타' ? 'other' : '';

        if (userData.role == 'doctor') {
            UserModel.createCounselor(userData);
        } else if (userData.role == 'patient') {
            UserModel.createPatient(userData);
        }

        res.redirect("/auth/login");
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

        const patientUser = await UserModel.getPatientByNickname(nickname);
        const counselorUser = await UserModel.getCounselorByNickname(nickname);

        if (!patientUser && !counselorUser) {
            return res.status(200).json({ isDuplicate: false });
        } else {
            return res.status(200).json({ isDuplicate: true });
        }
    },

    // 로그인 페이지 로드
    loginLoad: (req, res) => {
        res.render('login/login');
    },

    // 로그인 처리
    login: async (req, res) => {
        const { email, password, role } = req.body;
        try {
            let user;
            if (role === 'patient') {
                user = await UserModel.loginPatient(email, password);
            } else if (role === 'counselor') {
                user = await UserModel.loginCounselor(email, password);
            }

            if (user) {
                req.session.user = {
                    id: user.patient_id || user.counselor_id,
                    email: user.email,
                    nickname: user.nickname,
                    role: role
                };
                res.json({ success: true });
            } else {
                res.status(400).json({ success: false, error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
            }
        } catch (error) {
            console.error("Login error:", error);
            res.status(500).json({ success: false, error: '서버 오류가 발생했습니다.' });
        }
    },

    // 로그아웃
    logout: (req, res) => {
        req.session.destroy((err) => {
            if (err) {
                console.error("Logout error:", err);
                res.status(500).json({ success: false, error: '로그아웃 중 오류가 발생했습니다.' });
            } else {
                res.json({ success: true });
            }
        });
    }
};