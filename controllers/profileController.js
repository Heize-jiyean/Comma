const UserModel = require('../models/User');
const DiaryModel = require('../models/Diary');
const GuestbookModel = require('../models/Guestbook');
const AccessCheck = require('../utils/authUtils');
const EmotionData = require('../utils/emotionUtils');
const ArticleModel = require('../models/Article'); 
const ScrapModel = require('../models/Scrap');
const smtpTransport = require('../email');
const ArticleInteractionModel = require('../models/ArticleInteraction');
const axios = require('axios');

const DEFAULT_PROFILE_IMAGE = "https://firebasestorage.googleapis.com/v0/b/comma-5a85c.appspot.com/o/profile%2Fdefault_profile_photo.png?alt=media&token=7f2397c8-76f4-49b8-9c16-52b9ab242a9e"
function setDefaultImage(image_url) {
    if (image_url == null) image_url = "https://firebasestorage.googleapis.com/v0/b/comma-5a85c.appspot.com/o/images%2F%EC%8A%A4%ED%81%AC%EB%A6%B0%EC%83%B7%202024-07-10%20171637.png?alt=media&token=d979b5b3-0d0b-47da-a72c-2975caf52acd";
    return image_url;
}

// 환자 프로필 페이지 반환
exports.patientProfilePage = async (req, res) => {
    // 로그인하지 않은 사용자가 접근할 경우
    if (!AccessCheck.isUserAuthenticated(req.session.user)) {
        const referer = req.get('Referer') || '/';
        return res.status(403).send(`<script>alert("권한이 없습니다."); window.location.href = "${referer}";</script>`);
    }

    // 로그인한 사용자
    const loginId = req.session.user.id;
    const loginRole = req.session.user.role;

    try {
        // 환자 정보 가져오기
        const patientId = req.params.patientId;
        const patientUser = await UserModel.getPatientByUserId(patientId);

        // 없는 환자일 경우
        if (!patientUser) {
            res.render("/");    // TODO: 없는 환자인 경우 띄울 페이지
            console.log("없는 환자임");
            // return;
        }

        // 접근 권한 확인
        if (loginRole === 'counselor' || (loginRole === 'patient' && loginId == patientUser.patient_id)) {

            // 환자가 작성한 일기 가져오기
            const diaries = await DiaryModel.findLatestFourByPatientId(patientUser.patient_id);

            // 환자에게 작성된 방명록 가져오기
            const guestbooks = await GuestbookModel.findLatestFourByPatientId(patientUser.patient_id);
            
            
            // 각 방명록 항목에 대해 상담사의 닉네임, 이미지 가져오기
            for (let guestbook of guestbooks) {
                const counselor = await UserModel.getCounselorByCounselorId(guestbook.counselor_id);
                guestbook.counselorId = counselor ? counselor.id : "Unknown";
                guestbook.counselorNickname = counselor ? counselor.nickname : "Unknown";
                // 프로필 사진이 null일 경우 기본 이미지로 설정
                guestbook.counselorProfilePicture = counselor && counselor.profile_picture ? counselor.profile_picture : DEFAULT_PROFILE_IMAGE;
            }

            // 관심 환자인지 여부 확인
            let isCounselorScrapPatient;
            if (loginRole === 'counselor') {
                isCounselorScrapPatient = await ScrapModel.checkCounselorScrapPatient(patientUser.patient_id, loginId);
            }

            // 감정차트 데이터 불러오기
            const Data = await DiaryModel.getEmotionData(patientUser.patient_id);

            // 렌더링
            res.render("profile/patient.ejs", { 
                patientUser: patientUser, 
                type: 'patient', 
                diaries: diaries, 
                guestbooks: guestbooks,
                loginRole: loginRole,
                isCounselorScrapPatient: isCounselorScrapPatient,
                lineChartEmotionData: Data
            });
        } else {
            res.status(403).send("접근 권한이 없습니다.");
        }

    } catch (error) {
        console.error("환자 프로필 반환 오류:", error);
        res.status(500).send("서버 오류가 발생했습니다.");
    };
}

// 상담사 프로필 페이지 반환
exports.counselorProfilePage = async (req, res) => {
    // 로그인하지 않은 사용자가 접근할 경우
    if (!AccessCheck.isUserAuthenticated(req.session.user)) {
        const referer = req.get('Referer') || '/';
        return res.status(403).send(`<script>alert("권한이 없습니다."); window.location.href = "${referer}";</script>`);
    }

    // 로그인한 사용자
    const loginId = req.session.user.id;
    const loginRole = req.session.user.role;

    try {
        // 상담사 정보 가져오기
        const counselorId = req.params.counselorId;
        const counselorUser = await UserModel.getCounselorByUserId(counselorId);

        // 없는 상담사일 경우
        if (!counselorUser) {
            res.render("/");
            console.log("없는 상담사임");
            return;
        }

        // 상담사가 작성한 최신 아티클 4개 가져오기
        const articles = await ArticleModel.findLatestFourByCounselorId(counselorUser.counselor_id);

        // 로그인한 사용자에 따라 다른 방명록 데이터 불러오기
        let guestbooks;
        if (loginRole === 'counselor') {
            // 상담사가 작성한 최신 방명록 4개 가져오기
            guestbooks = await GuestbookModel.findLatestFourByCounselorId(counselorUser.counselor_id);
        } else if (loginRole === 'patient') {
            // 상담사가 로그인한 환자에게 작성한 최신 방명록 4개 불러오기
            guestbooks = await GuestbookModel.findLatestFourToPatient(loginId, counselorUser.counselor_id);
        }

        // 각 방명록 항목에 대해 환자의 닉네임과 이미지 가져오기
        for (let guestbook of guestbooks) {
            const patient = await UserModel.getPatientByPatientId(guestbook.patient_id);
            guestbook.patientId = patient ? patient.patient_id : "Unknown";
            guestbook.patientNickname = patient ? patient.nickname : "Unknown";
            guestbook.patientProfilePicture = patient ? patient.profile_picture : null;
        }
        // 추천 아티클 가져오기
        //const RecommendPreviews = await ArticleModel.getRecommendPreviewsByPatientId(loginId);  // 이 함수는 실제 데이터베이스 모델에 따라 다름

        // 관심 상담사인지 여부 확인
        let isPatientScrapCounselor;
        if (loginRole === 'patient') {
            isPatientScrapCounselor = await ScrapModel.checkPatientScrapCounselor(loginId, counselorUser.counselor_id);
        }

        // 렌더링
        res.render("profile/counselor.ejs", { 
            counselorUser: counselorUser, 
            type: 'counselor',
            articles: articles,
            guestbooks: guestbooks,
            loginRole: loginRole,
            isPatientScrapCounselor: isPatientScrapCounselor,
            //RecommendPreviews: RecommendPreviews // 추가된 변수
        });

    } catch (error) {
        console.log("상담사 프로필 반환 오류", error);
        res.status(500).send("서버 오류가 발생했습니다.")
    }
};

// 환자 일기 모아보기 페이지 반환
exports.listAllDiaries = async (req, res) => {
    try {
        // 예외 처리
        const patientId = req.params.patientId;
        const patientUser = await UserModel.getPatientByUserId(patientId);
        if (!patientUser) {
            return res.status(404).render("error", { message: "해당 환자를 찾을 수 없습니다." });// TODO: 없는 환자인 경우 띄울 페이지
        }

        const role = req.session.user.role;
        const loginId = req.session.user.id;

        if (role === "patient" && loginId !== patientUser.patient_id) {
            return res.status(403).send(`<script>alert("권한이 없습니다."); window.location.href = "/";</script>`);
        }

        const totalPages = Math.ceil(await DiaryModel.countOfFindByPatientId(patientUser.patient_id, role) / 9);
        const currentPage = req.query.page ? parseInt(req.query.page) : 1;
        const Previews = await DiaryModel.PreviewfindByPatientId(currentPage, patientUser.patient_id, role, 9);

        if (Previews) {
            Previews.forEach(preview => {
                preview.image_url = setDefaultImage(preview.image_url);
            });
        }

        // 관심 환자인지 여부 확인
        let isCounselorScrapPatient;
        if (role === 'counselor') {
            isCounselorScrapPatient = await ScrapModel.checkCounselorScrapPatient(patientId, loginId);
        }

        // 렌더링 부분에서 변수 전달
        res.render('profile/diary', { 
            patientUser, 
            type: 'patient', 
            Previews, 
            currentPage, 
            totalPages,
            loginRole: role,
            isCounselorScrapPatient: isCounselorScrapPatient // 추가
        });


        // res.render('profile/diary', { 
        //     patientUser, 
        //     type: 'patient', 
        //     Previews, 
        //     currentPage, 
        //     totalPages, 
        //     loginRole: role
        // });

    } catch (error) {
        console.error("listAllDiaries 오류:", error);
        res.status(500).send("서버 오류가 발생했습니다.");
    }
};

// 환자 방명록 모아보기 페이지 반환
exports.listAllGuestbooks = async (req, res) => {
    // 로그인하지 않은 사용자가 접근할 경우
    if (!AccessCheck.isUserAuthenticated(req.session.user)) {
        const referer = req.get('Referer') || '/';
        return res.status(403).send(`<script>alert("권한이 없습니다."); window.location.href = "${referer}";</script>`);
    }

    const loginId = req.session.user.id;
    const loginRole = req.session.user.role;

    try {
        // 환자 정보 가져오기
        const patientId = req.params.patientId;
        const patientUser = await UserModel.getPatientByUserId(patientId);

        // 없는 환자일 경우
        if (!patientUser) {
            return res.status(404).render("error", { message: "해당 환자를 찾을 수 없습니다." });
        }

        // 접근 권한 확인
        if (loginRole === 'counselor' || (loginRole === 'patient' && loginId === patientUser.patient_id)) {
            const limit = 10;
            const totalGuestbooks = await GuestbookModel.countByPatientId(patientUser.patient_id);
            const totalPages = Math.ceil(totalGuestbooks / limit);
            const currentPage = req.query.page ? parseInt(req.query.page) : 1;
            const guestbooks = await GuestbookModel.findAllByPatientIdWithPagination(patientUser.patient_id, currentPage, limit);

            for (let guestbook of guestbooks) {
                const counselor = await UserModel.getCounselorByCounselorId(guestbook.counselor_id);
                guestbook.counselorId = counselor ? counselor.id : "Unknown";
                guestbook.counselorNickname = counselor ? counselor.nickname : "Unknown";
                guestbook.counselorProfilePicture = counselor && counselor.profile_picture ? counselor.profile_picture : DEFAULT_PROFILE_IMAGE;
            }

            // `isCounselorScrapPatient` 변수 추가
            let isCounselorScrapPatient;
            if (loginRole === 'counselor') {
                isCounselorScrapPatient = await ScrapModel.checkCounselorScrapPatient(patientId, loginId);
            }

            //임의로 손댄부분(원본주석,아래코드임의작성)
            // 렌더링 부분에서 변수 전달
            res.render("profile/guestbook.ejs", { 
                patientUser: patientUser, 
                type: 'patient', 
                guestbooks: guestbooks,
                currentPage: currentPage,
                totalPages: totalPages,
                loginRole: loginRole,
                isCounselorScrapPatient: isCounselorScrapPatient // 추가
            });

            // res.render("profile/guestbook.ejs", { 
            //     patientUser: patientUser, 
            //     type: 'patient', 
            //     guestbooks: guestbooks,
            //     currentPage: currentPage,
            //     totalPages: totalPages,
            //     loginRole: loginRole 
            // });

        } else {
            res.status(403).send("접근 권한이 없습니다.");
        }
    } catch (error) {
        console.error("listAllGuestbooks 오류:", error);
        res.status(500).send("서버 오류가 발생했습니다.");
    }
};


// 상담사 방명록 전체보기 페이지 반환
exports.listAllGuestbooksByCounselor = async (req, res) => {
    if (!AccessCheck.isUserAuthenticated(req.session.user)) {
        const referer = req.get('Referer') || '/';
        return res.status(403).send(`<script>alert("권한이 없습니다."); window.location.href = "${referer}";</script>`);
    }

    const loginId = req.session.user.id;
    const loginRole = req.session.user.role;

    try {
        const counselorId = req.params.counselorId;
        const counselorUser = await UserModel.getCounselorByUserId(counselorId);

        if (!counselorUser) {
            return res.status(404).render("error", { message: "해당 상담사를 찾을 수 없습니다." });
        }

        const limit = 10; // 한 페이지에 보여줄 방명록 수
        let totalGuestbooks;
        let totalPages;
        let guestbooks;
        let currentPage;
        
        if (loginRole === 'counselor') {
            totalGuestbooks = await GuestbookModel.countByCounselorId(counselorUser.counselor_id);
            totalPages = Math.ceil(totalGuestbooks / limit);

            currentPage = req.query.page ? parseInt(req.query.page) : 1;
            guestbooks = await GuestbookModel.findAllByCounselorIdWithPagination(counselorUser.counselor_id, currentPage, limit);

        } else if (loginRole === 'patient') {
            totalGuestbooks = await GuestbookModel.countByPatientIdAndCounselorId(loginId, counselorUser.counselor_id,);
            totalPages = Math.ceil(totalGuestbooks / limit);

            currentPage = req.query.page ? parseInt(req.query.page) : 1;
            guestbooks = await GuestbookModel.findAllByPatientIdAndCounselorIdWithPagination(loginId, counselorUser.counselor_id, currentPage, limit);
        } 

        for (let guestbook of guestbooks) {
            const patient = await UserModel.getPatientByPatientId(guestbook.patient_id);
            guestbook.patientId = patient ? patient.id : "Unknown";
            guestbook.patientNickname = patient ? patient.nickname : "Unknown";
            guestbook.patientProfilePicture = patient ? patient.profile_picture : null;

            // 추가: 방명록을 작성한 상담사의 프로필 사진이 제대로 설정되어 있는지 확인
            guestbook.counselorProfilePicture = counselorUser.profile_picture ? counselorUser.profile_picture : DEFAULT_PROFILE_IMAGE;
        }

        let isPatientScrapCounselor;
        if (loginRole === 'patient') {
            isPatientScrapCounselor = await ScrapModel.checkPatientScrapCounselor(loginId, counselorUser.counselor_id);
        }

        res.render("profile/guestbook.ejs", { 
            counselorUser: counselorUser, 
            type: 'counselor',  // 현재 보고 있는 프로필이 상담사임을 표시
            guestbooks: guestbooks,
            currentPage: currentPage,
            totalPages: totalPages,
            loginRole: loginRole,
            isPatientScrapCounselor: isPatientScrapCounselor
        });
        
    } catch (error) {
        console.error("listAllGuestbooksByCounselor 오류:", error);
        res.status(500).send("서버 오류가 발생했습니다.");
    }
};


// 프로필 설정 - 프로필 편집 페이지 반환
exports.profileEditPage = async(req, res) => {
    // 로그인하지 않은 사용자가 접근할 경우
    if (!AccessCheck.isUserAuthenticated(req.session.user)) {
        const referer = req.get('Referer') || '/';
        return res.status(403).send(`<script>alert("권한이 없습니다."); window.location.href = "${referer}";</script>`);
    }

    const loginId = req.session.user.id;
    const loginRole = req.session.user.role;

    try {
        let loginUser;

        if (loginRole === 'patient') {
            loginUser = await UserModel.getPatientByPatientId(loginId);
        } else if (loginRole === 'counselor') {
            loginUser = await UserModel.getCounselorByCounselorId(loginId);
        }

        let hasProfileImage = true;
        if (!loginUser.profile_picture) {
            console.log("프사 없음");
            loginUser.profile_picture = DEFAULT_PROFILE_IMAGE;
            hasProfileImage = false;
        }

        // 렌더링
        res.render("profile/setting.ejs", { 
            page: 'profileEdit', 
            loginRole,
            loginUser,
            hasProfileImage
        });

    } catch (error) {
        console.error("프로필 설정 - 프로필 편집 페이지 반환 오류:", error);
        res.status(500).send("서버 오류가 발생했습니다.");
    }
}

// 프로필 설정 - 프로필 편집 처리 (프로필 이미지)
exports.profilePhotoEdit = async(req, res) => {
    const loginId = req.session.user.id;
    const loginRole = req.session.user.role;

    try {
        const { profilePhotoData } = req.body;

        if (loginRole === 'patient') {
            UserModel.updatePatientProfilePhoto(loginId, profilePhotoData);
        } else if (loginRole === 'counselor') {
            UserModel.updateCounselorProfilePhoto(loginId, profilePhotoData);
        }

        res.status(200).json({ success: true });

    } catch (error) {
        console.log("프로필 설정 - 프로필 편집 처리 (프로필 이미지) 오류:", error);
        res.status(500).send("서버 오류가 발생했습니다.");
    }
}

// 프로필 설정 - 프로필 편집 처리 (프로필 정보)
exports.profileInfoEdit = async(req, res) => {
    const loginId = req.session.user.id;
    const loginRole = req.session.user.role;
    
    try {
        const { profileInfoData } = req.body;

        if (loginRole === 'patient') {
            UserModel.updatePatientProfileInfo(loginId, profileInfoData);
        } else if (loginRole === 'counselor') {
            UserModel.updateCounselorProfileInfo(loginId, profileInfoData);
        }
        
        res.status(200).json({ success: true });

    } catch (error) {
        console.log("프로필 설정 - 프로필 편집 처리 (프로필 정보) 오류:", error);
        res.status(500).send("서버 오류가 발생했습니다.");
    }
}


// 프로필 설정 - 비밀번호 변경 페이지 반환
exports.passwordChangePage = async(req, res) => {
    // 로그인하지 않은 사용자가 접근할 경우
    if (!AccessCheck.isUserAuthenticated(req.session.user)) {
        const referer = req.get('Referer') || '/';
        return res.status(403).send(`<script>alert("권한이 없습니다."); window.location.href = "${referer}";</script>`);
    } 

    const loginId = req.session.user.id;
    const loginRole = req.session.user.role;

    try {
        let loginUser;

        if (loginRole === 'patient') {
            loginUser = await UserModel.getPatientByPatientId(loginId);
        } else if (loginRole === 'counselor') {
            loginUser = await UserModel.getCounselorByCounselorId(loginId);
        }

        // 렌더링
        res.render("profile/setting.ejs", { 
            page: 'passwordChange',
            loginUser
        });
    } catch (error) {
        console.log("프로필 설정 - 비밀번호 변경 페이지 반환 오류: ", error);
        res.status(500).send("서버 오류가 발생했습니다.");
    }
}

// 프로필 설정 - 비밀번호 변경 처리
exports.passwordChange = async(req, res) => {
    const loginId = req.session.user.id;
    const loginRole = req.session.user.role;
    const currentPassword = req.body.currentPassword;
    const newPassword = req.body.newPassword;

    try {
        // 현재 배밀번호 확인
        let isPasswordCorrect;
        if (loginRole === 'patient') {
            isPasswordCorrect = await UserModel.checkPatientPassword(loginId, currentPassword);
        } else if (loginRole === 'counselor') {
            isPasswordCorrect = await UserModel.checkCounselorPassword(loginId, currentPassword);
        }

        // 현재 비밀번호가 일치하지 않은 경우
        if (!isPasswordCorrect) {
            return res.status(401).json({ 
                success: false, 
                message: '현재 비밀번호가 일치하지 않습니다.' 
            });
        }

        // 새 비밀번호로 업데이트
        if (loginRole === 'patient') {
            await UserModel.updatePatientPassword(loginId, newPassword);
        } else if (loginRole === 'counselor') {
            await UserModel.updateCounselorPassword(loginId, newPassword);
        }

        // 성공 응답 메시지 보내기
        res.status(200).json({
            success: true,
            message: '비밀번호가 성공적으로 변경되었습니다.'
        })


    } catch (error) {
        console.log("프로필 설정 - 비밀번호 변경 처리 오류: ", error);
        res.status(500).send("서버 오류가 발생했습니다.");
    }
}

// 랜덤 인증번호 생성 코드
const generateRandomNumber = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

// 프로필 설정 - 비밀번호 잊었을 경우, 메일 보내기
exports.sendCode = async(req, res) => {
    const number = generateRandomNumber(111111, 999999);
    const { email } = req.body;

    const mailOptions = {
        from: "team.ive.comma@gmail.com",
        to: email,
        subject: "Comma 인증 메일 입니다.",
        html: '<h1>인증번호를 입력해주세요 \n\n\n\n\n\n</h1>' + number
    }

    smtpTransport.sendMail(mailOptions, (err, response) => {
        if (err) {
            res.status(500).json({ ok: false });
        } else {
            res.json({ ok: true , authNum: number });
        }
        res.set('Cache-Control', 'no-store');
        smtpTransport.close(); // 전송 종료
    });

}

// 비밀번호 잊은 경우, 비밀번호 변경 처리
exports.modalPasswordChange = async(req, res) => {
    const loginId = req.session.user.id;
    const loginRole = req.session.user.role;
    const modalNewPassword = req.body.modalNewPassword;


    try {
        // 새 비밀번호로 업데이트
        if (loginRole === 'patient') {
            await UserModel.updatePatientPassword(loginId, modalNewPassword);
        } else if (loginRole === 'counselor') {
            await UserModel.updateCounselorPassword(loginId, modalNewPassword);
        }

        // 성공 응답 메시지 보내기
        res.status(200).json({
            success: true,
            message: '비밀번호가 성공적으로 변경되었습니다.'
        })


    } catch (error) {
        console.log("프로필 설정 - 비밀번호 변경 처리 오류: ", error);
        res.status(500).send("서버 오류가 발생했습니다.");
    }
    
}

// 프로필 설정 - 탈퇴 페이지 반환
exports.accountRemovalPage = async(req, res) => {
    // 로그인하지 않은 사용자가 접근할 경우
    if (!AccessCheck.isUserAuthenticated(req.session.user)) {
        const referer = req.get('Referer') || '/';
        return res.status(403).send(`<script>alert("권한이 없습니다."); window.location.href = "${referer}";</script>`);
    }

    try {
        // 렌더링
        res.render("profile/setting.ejs", { page: 'accountRemoval' });
    } catch (error) {
        console.log("프로필 설정 - 탈퇴 페이지 반환 오류: ", error);
    }
}

// 프로필 설정 - 탈퇴 처리
exports.accountRemoval = async(req, res) => {
    const loginId = req.session.user.id;
    const loginRole = req.session.user.role;
    const password = req.body.password;

    try {
        let isPasswordCorrect = false;

        if (loginRole === 'patient') {
            isPasswordCorrect = await UserModel.checkPatientPassword(loginId, password);
        } else if (loginRole === 'counselor') {
            isPasswordCorrect = await UserModel.checkCounselorPassword(loginId, password);
        }

        if (isPasswordCorrect === false) {
            return res.status(401).json({ 
                success: false, 
                message: '비밀번호가 일치하지 않습니다.'
            });
        }

        // 비밀번호가 일치하면 탈퇴 처리
        if (loginRole === 'patient') {
            const diaryData = await DiaryModel.findByPatientId(loginId);

            await UserModel.removePatient(loginId);
            await axios.post('http://localhost:8000/delete_vector', { idx: 1, id: loginId });
            await axios.post('http://localhost:8000/delete_vectors', { idx: 2, ids: diaryData });
        } else if (loginRole === 'counselor') {
            const articleData = await ArticleModel.findByCounselorId(loginId);

            await UserModel.removeCounselor(loginId);
            await axios.post('http://localhost:8000/delete_vectors', { idx: 0, ids: articleData });
        }

        req.session.destroy();  // 세션 파괴 처리

        // 성공 응답 메시지 보내기
        res.status(200).json({
            success: true,
            message: '계정이 성공적으로 삭제되었습니다.'
        })

    } catch (error) {
        console.log("프로필 설정 - 탈퇴 처리 오류: ", error);
        res.status(500).send("서버 오류가 발생했습니다.");
    }

}


// 감정 차트 반환페이지 
exports.charts = async (req, res) => {
    try {
        // 환자 정보 가져오기
        const patientId = req.params.patientId;
        const patientUser = await UserModel.getPatientByUserId(patientId);

        if (req.session.user) {
            if (req.session.user.role == 'patient') {
                if (patientUser.patient_id != req.session.user.id) {
                    const referer = req.get('Referer') || '/';
                    return res.status(403).send(`<script>alert("권한이 없습니다."); window.location.href = "${referer}";</script>`);
                }
            } 
        
            let Data = [];
            // 데이터 불러오기 
            if (req.query.year && req.query.month) {
                Data = await DiaryModel.getEmotionDataByMonth(patientUser.patient_id, req.query.year, req.query.month);
            }
            else {
                Data = await DiaryModel.getEmotionData(patientUser.patient_id);
            }

            const Percentages = await EmotionData.calculateEmotionPercentages(Data);
            const descriptionEmotions = await  EmotionData.generateEmotionSummary(Percentages);
            const monthlyPercentages = await EmotionData.calculateMonthlyEmotionPercentages(patientUser);


            // 관심 환자인지 여부 확인
            let isCounselorScrapPatient;
            if (req.session.user.role === 'counselor') {
                isCounselorScrapPatient = await ScrapModel.checkCounselorScrapPatient(patientUser.patient_id, req.session.user.id);
            }

            res.render('profile/emotion-chart', 
                {patientUser, type: 'patient',
                lineChartEmotionData: Data, //꺾은선차트
                doughnutChartEmotionData: Percentages, // 도넛차트
                barChartData: monthlyPercentages, // 막대차트
                descriptionEmotions,
                isCounselorScrapPatient
            });
        }
        else return res.render("login/login");

    } catch (error) {
        console.error("newDiary 오류:", error);
        res.status(500).send("서버 오류가 발생했습니다.");
    }
}

// 관심 환자, 관심 상담사 등록
exports.addScrap = async(req, res) => {
    const loginId = req.session.user.id;
    const loginRole = req.session.user.role;
    const targetId = req.params.targetId;

    try {
        if (loginRole === 'patient') {
            targetUser = await UserModel.getCounselorByUserId(targetId);
            result = await ScrapModel.addScrapCounselor(loginId, targetUser.counselor_id);
        } else if (loginRole === 'counselor') {
            targetUser = await UserModel.getPatientByUserId(targetId);
            result = await ScrapModel.addScrapPatient(targetUser.patient_id, loginId);
        }

        if (result) {
            res.status(200).json({ success: true, message: "성공적으로 등록되었습니다." });
        } else {
            res.status(400).json({ success: false, message: "등록에 실패했습니다." });
        }

    } catch (error) {
        console.error("addScrap 오류:", error);
        res.status(500).send("서버 오류가 발생했습니다.");
    }
}

// 관심 환자, 관심 상담사 해제
exports.removeScrap = async(req, res) => {
    const loginId = req.session.user.id;
    const loginRole = req.session.user.role;
    const targetId = req.params.targetId;

    try {
        if (loginRole === 'patient') {
            targetUser = await UserModel.getCounselorByUserId(targetId);
            result = await ScrapModel.removeScrapCounselor(loginId, targetUser.counselor_id);
        } else if (loginRole === 'counselor') {
            targetUser = await UserModel.getPatientByUserId(targetId);
            result = await ScrapModel.removeScrapPatient(targetUser.patient_id, loginId);
        }

        if (result) {
            res.status(200).json({ success: true, message: "성공적으로 등록되었습니다." });
        } else {
            res.status(400).json({ success: false, message: "등록에 실패했습니다." });
        }

    } catch (error) {
        console.error("removeScrap 오류:", error);
        res.status(500).send("서버 오류가 발생했습니다.");
    }
}




// 저장한 아티클 리스트
exports.article = async (req, res) => {
    try {
        if (req.session.user) {
            if (!AccessCheck.checkPatientRole(req.session.user.role)) {
                const referer = req.get('Referer') || '/';
                return res.status(403).send(`<script>alert("권한이 없습니다."); window.location.href = "${referer}";</script>`);
            }
            const patientId = req.params.patientId;
            const patientUser = await UserModel.getPatientByUserId(patientId);
            const patient_id = patientUser.patient_id;


            const option = req.query.option ? req.query.option : "like";
            let currentPage = req.query.page ? parseInt(req.query.page) : 1;

            const totalPages = Math.ceil( await ArticleInteractionModel.countOfFindInteraction(patient_id, option) / 9);
            let Previews = await ArticleInteractionModel.PreviewFindInteraction(patient_id, currentPage, option); 

            if (Previews) {
                Previews.forEach(preview => {
                    preview.thumbnail_url = setDefaultImage(preview.thumbnail_url);
                });
            }
            
            res.render('profile/article', {patientUser, type: 'patient', Previews, currentPage, totalPages});
        }
        else return res.render("login/login");
    } catch (error) {
        console.error("listAllDiaries 오류:", error);
        res.status(500).send("서버 오류가 발생했습니다.");
    }
}



// 내가 스크랩한 관심 환자 or 관심 상담사
exports.listMyScraps = async(req, res) => {
    try {
        const loginId = req.session.user.id;
        const loginRole = req.session.user.role;
        const scrapUserList = [];

        if (loginRole === 'patient') {
            const scrappedCounselors = await ScrapModel.getScrappedCounselorsByPatientId(loginId);
            for (counselor of scrappedCounselors) {
                const counselorUser = await UserModel.getCounselorByCounselorId(counselor.counselor_id);
                if (counselorUser) {
                    counselorUser.role = 'counselor';
                    scrapUserList.push(counselorUser)
                }
            }
        } else if (loginRole === 'counselor') {
            const scrappedPatients = await ScrapModel.getScrappedPatientsByCounselorId(loginId);
            for (patient of scrappedPatients) {
                const patientUser = await UserModel.getPatientByPatientId(patient.patient_id);
                if (patientUser) {
                    patientUser.role = 'patient';
                    scrapUserList.push(patientUser)
                }
            }
        }

        res.render("profile/scrap.ejs", { scrapUserList: scrapUserList });
    } catch (error) {
        console.log("listMyScraps 오류:", error);
        res.status(500).send("서버 오류가 발생했습니다.");
    }
}

// 나를 스크랩한 관심 환자 or 관심 상담사
exports.listScrapsOnMe = async(req, res) => {
    try {
        const loginId = req.session.user.id;
        const loginRole = req.session.user.role;
        const scrapUserList = [];

        if (loginRole === 'patient') {
            const scrappingCounselors = await ScrapModel.getScrappingCounselorsByPatientId(loginId);
            for (const counselor of scrappingCounselors) {
                const counselorUser = await UserModel.getCounselorByCounselorId(counselor.counselor_id);
                if (counselorUser) {
                    counselorUser.role = 'counselor';
                    scrapUserList.push(counselorUser);
                }
            }
        } else if (loginRole === 'counselor') {
            const scrappingPatients = await ScrapModel.getScrappingPatientsByCounselorId(loginId);
            for (const patient of scrappingPatients) {
                const patientUser = await UserModel.getPatientByPatientId(patient.patient_id);
                if (patientUser) {
                    patientUser.role = 'patient';
                    scrapUserList.push(patientUser);
                }
            }
        }

        res.render("profile/scrap.ejs", { scrapUserList: scrapUserList })
    } catch (error) {
        console.log("listScrapsOnMe 오류:", error);
        res.status(500).send("서버 오류가 발생했습니다.");
    }
}