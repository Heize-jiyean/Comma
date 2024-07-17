const bcrypt = require('bcrypt');
const UserModel = require('../models/User');
const smtpTransport = require('../email');

// 랜덤 인증번호 생성 코드
const generateRandomNumber = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };


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

    // 이메일 인증 번호 보내기
    emailAuth: async (req, res) => {
        const number = generateRandomNumber(111111, 999999);
        const email = req.body.email;

        const mailOptions = {
            from: "team.ive.comma@gmail.com",
            to: email,
            subject: "Comma 인증 메일 입니다.",
            html: '<h1>인증번호를 입력해주세요 \n\n\n\n\n\n</h1>' + number
        };

        smtpTransport.sendMail(mailOptions, (err, response) => {
            if (err) {
                res.status(500).json({ ok: false });
            } else {
                res.json({ ok: true , authNum: number });
            }
            res.set('Cache-Control', 'no-store');
            smtpTransport.close(); // 전송 종료
        });
    },

    // 이메일 인증 번호 보내기
    emailAuth: async (req, res) => {
        console.log('Email auth request received:', req.body);
        const number = generateRandomNumber(111111, 999999);
        const email = req.body.email;

        const mailOptions = {
            from: "team.ive.comma@gmail.com",
            to: email,
            subject: "Comma 인증 메일 입니다.",
            html: '<h1>인증번호를 입력해주세요 \n\n\n\n\n\n</h1>' + number
        };

        smtpTransport.sendMail(mailOptions, (err, response) => {
            if (err) {
                console.error('Email sending error:', err);
                res.status(500).json({ ok: false });
            } else {
                console.log('Email sent successfully');
                res.json({ ok: true , authNum: number });
            }
            res.set('Cache-Control', 'no-store');
            smtpTransport.close(); // 전송 종료
        });
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

    //login함수-로깅추가
    login: async (req, res) => {
        console.log('Login attempt:', req.body);
        const { email, password } = req.body;
        try {
            let user = await UserModel.loginPatient(email, password);
            if (!user) {
                user = await UserModel.loginCounselor(email, password);
            }
    
            if (user) {
                console.log('Login successful for user:', user.email);
                req.session.user = {
                    id: user.patient_id || user.counselor_id,
                    email: user.email,
                    nickname: user.nickname,
                    role: user.patient_id ? 'patient' : 'counselor'
                };
                res.json({ success: true, message: '로그인 성공' });
            } else {
                console.log('Login failed: Invalid credentials');
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