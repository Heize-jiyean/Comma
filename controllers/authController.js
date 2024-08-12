const bcrypt = require('bcrypt');
const crypto = require('crypto');
const UserModel = require('../models/User');
const smtpTransport = require('../email');
const { checkPassword } = require('../public/js/passwordValidation');

console.log('authController loaded');//컨트롤러 로드 확인


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
                res.json({ ok: true, authNum: number });
            }
            res.set('Cache-Control', 'no-store');
            smtpTransport.close(); // 전송 종료
        });
    },

    // 아이디 중복 확인
    checkId: async (req, res) => {
        const id = req.body.id;

        const patientUser = await UserModel.getPatientByUserId(id);
        const counselorUser = await UserModel.getCounselorByUserId(id);

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
                    custom_id: user.id,
                    email: user.email,
                    nickname: user.nickname,
                    role: user.patient_id ? 'patient' : 'counselor'
                };
                // 리다이렉트 URL을 응답에 포함
                res.json({
                    success: true,
                    message: '로그인 성공',
                    redirectUrl: '/'  // 메인 페이지로 리다이렉트
                });
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
                res.clearCookie('session_cookie_name'); // 세션 쿠키 삭제
                res.json({ success: true, message: '로그아웃되었습니다.' }); // 성공 응답 보내기
            }
        });
    },

    // 비밀번호 찾기 페이지 로드
    forgotPasswordLoad: (req, res) => {
        res.render('login/forgot-password');
    },

    // 비밀번호 재설정 이메일 전송
    forgotPassword: async (req, res) => {
        const { email } = req.body;
        try {
            console.log('Attempting to find user with email:', email);
            let user = await UserModel.getPatientByEmail(email);
            if (!user) {
                console.log('User not found in patient table, checking counselor table');
                user = await UserModel.getCounselorByEmail(email);
            }

            if (!user) {
                console.log('User not found');
                return res.status(404).json({ success: false, message: '해당 이메일로 등록된 사용자가 없습니다.' });
            }

            console.log('User found:', user);

            // 토큰 생성
            const token = crypto.randomBytes(20).toString('hex');
            const expires = Date.now() + 3600000; // 1시간 후 만료


            console.log('Generated token:', token);//토큰 생const resetUrl성 확인

            console.log('Attempting to save reset token');
            // 사용자 모델에 토큰 저장
            const saveResult = await UserModel.saveResetToken(user.id, token, expires);
            console.log('Save result:', saveResult);
            if (!saveResult) {
                console.log('Failed to save reset token');
                return res.status(500).json({ success: false, message: '토큰 저장 중 오류가 발생했습니다.' });
            }

            console.log('Reset token saved successfully');

            // 이메일 전송
            const resetUrl = `http://${req.headers.host}/auth/reset-password/${token}`;
            console.log('Reset URL:', resetUrl);
            const mailOptions = {
                from: "team.ive.comma@gmail.com",
                to: email,
                subject: "Comma 비밀번호 재설정",
                html: `<p>비밀번호를 재설정하려면 다음 링크를 클릭하세요:</p>
                       <a href="${resetUrl}">${resetUrl}</a>`
            };

            console.log('Attempting to send email');
            smtpTransport.sendMail(mailOptions, (err, response) => {
                if (err) {
                    console.error("Email sending error:", err);
                    return res.status(500).json({ success: false, message: '이메일 전송 중 오류가 발생했습니다.' });
                }
                console.log('Email sent successfully');
                res.json({ success: true, message: '비밀번호 재설정 이메일이 전송되었습니다.' });
            });

        } catch (error) {
            console.error("Forgot password error:", error);
            res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
        }
    },

    // 닉네임 체크 함수
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

    // 비밀번호 재설정 페이지 로드
    resetPasswordLoad: async (req, res) => {
        const { token } = req.params;
        console.log('Received token:', token);
        console.log('resetPasswordLoad function called', { params: req.params });
        try {
            const user = await UserModel.getUserByResetToken(token);
            console.log('User found:', user);
            if (!user || Date.now() > user.resetTokenExpires) {
                return res.status(400).render('login/reset-password', { error: '유효하지 않거나 만료된 토큰입니다.' });
            }
            res.render('login/reset-password', { token });
        } catch (error) {
            console.error("Reset password load error:", error);
            res.status(500).render('login/reset-password', { error: '서버 오류가 발생했습니다.' });
        }
    },



    // 비밀번호 재설정
    resetPassword: async (req, res) => {
        console.log('Reset password function called', { params: req.params, body: req.body });
        const { token } = req.params;  // URL 파라미터에서 토큰을 가져옵니다.
        const { password } = req.body;

        console.log('Reset password request received:', {
            method: req.method,
            url: req.url,
            params: req.params,
            body: req.body
        });

        try {
            console.log('Attempting to reset password for token:', token);

            const user = await UserModel.getUserByResetToken(token);
            if (!user || Date.now() > user.resetTokenExpires) {
                console.log('Invalid or expired token');
                return res.status(400).json({ success: false, message: '유효하지 않거나 만료된 토큰입니다.' });
            }

            console.log('User found:', user.id);

            // 서버 측 비밀번호 유효성 검사
            const passwordError = checkPassword(password);
            if (passwordError) {
                console.log('Password validation failed');
                return res.status(400).json({ success: false, message: passwordError });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const updateResult = await UserModel.updatePassword(user.id, hashedPassword);

            if (!updateResult) {
                console.log('Failed to update password');
                return res.status(500).json({ success: false, message: '비밀번호 업데이트 중 오류가 발생했습니다.' });
            }

            console.log('Password updated successfully');

            await UserModel.clearResetToken(user.id);
            console.log('Reset token cleared');

            return res.status(200).render('login/login', { message: '로그인성공.' });
            
        } catch (error) {
            console.error("Reset password error:", error);
            res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
        }
    }
};