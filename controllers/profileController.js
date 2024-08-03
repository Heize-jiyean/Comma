const UserModel = require('../models/User');
const DiaryModel = require('../models/Diary')
const GuestbookModel = require('../models/Guestbook');
const AccessCheck = require('../utils/authUtils');
const EmotionData = require('../utils/emotionUtils');

const DEFAULT_PROFILE_IMAGE = "https://firebasestorage.googleapis.com/v0/b/comma-5a85c.appspot.com/o/profile%2Fdefault_profile_photo.png?alt=media&token=f496c007-8b78-4f52-995e-a330af92e2bc";


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
                guestbook.counselorProfilePicture = counselor ? counselor.profile_picture : null;
            }

            // 렌더링
            res.render("profile/patient.ejs", { 
                patientUser: patientUser, 
                type: 'patient', 
                diaries: diaries, 
                guestbooks: guestbooks,
                loginRole: loginRole
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

        // 페이지네이션 처리
        let guestbooks = [];        // 방명록 초기화
        let totalGuestbooks = 0;    // 방명록 개수 초기화
        const limit = 10;           // 한 페이지에 보여줄 방명록 수
        let currentPage = req.query.page ? parseInt(req.query.page) : 1;    // URL의 쿼리 매개변수 중 page 값을 가져옴 

        // 로그인한 사용자에 따라 다른 방명록 데이터 불러오기
        if (loginRole === 'counselor') {
            totalGuestbooks = await GuestbookModel.countByCounselorId(counselorUser.counselor_id);
            guestbooks = await GuestbookModel.findAllByCounselorIdWithPagination(counselorUser.counselor_id, currentPage, limit);
        } else if (loginRole === 'patient') {
            totalGuestbooks = await GuestbookModel.countByPatientId(loginId);
            guestbooks = await GuestbookModel.findAllByPatientIdWithPagination(loginId, currentPage, limit);
        }

        const totalPages = Math.ceil(totalGuestbooks / limit);


        // 렌더링
        res.render("profile/counselor.ejs", { 
            counselorUser: counselorUser, 
            type: 'counselor',
            guestbooks: guestbooks,
            currentPage: currentPage,
            totalPages: totalPages,
            loginRole: loginRole
        });
    } catch (error) {
        console.log("상담사 프로필 반환 오류", error);
        res.status(500).send("서버 오류가 발생했습니다.")
    }
}

// 환자 일기 모아보기 페이지 반환
exports.listAllDiaries = async (req, res) => {
    try {
        // 예외 처리
        const patientId = req.params.patientId;
        const patientUser = await UserModel.getPatientByUserId(patientId);
        if (!patientUser) {
            res.render("/");    // TODO: 없는 환자인 경우 띄울 페이지
            return;
        }

        if (req.session.user) {
            const role = req.session.user.role;
        
            if (role == "patient") {
                if (! AccessCheck.checkPatientId(role, req.session.user.id, patientUser.patient_id)) {
                    const referer = req.get('Referer') || '/';
                    return res.status(403).send(`<script>alert("권한이 없습니다."); window.location.href = "${referer}";</script>`);
                } 
            }

            const totalPages = Math.ceil( await DiaryModel.countOfFindByPatientId(patientUser.patient_id, role) / 9);
            let currentPage = req.query.page ? parseInt(req.query.page) : 1;
            let Previews = await DiaryModel.PreviewfindByPatientId(currentPage, patientUser.patient_id, role);

            if (Previews) {
                Previews.forEach(preview => {
                    preview.image_url = setDefaultImage(preview.image_url);
                });
            }
    
            res.render('profile/diary', { patientUser, type: 'patient', Previews, currentPage, totalPages});
        }
    } catch (error) {
        console.error("listAllDiaries 오류:", error);
        res.status(500).send("서버 오류가 발생했습니다.");
    }
}

function setDefaultImage(image_url) {
    if (image_url == null) image_url = "https://firebasestorage.googleapis.com/v0/b/comma-5a85c.appspot.com/o/images%2F%EC%8A%A4%ED%81%AC%EB%A6%B0%EC%83%B7%202024-07-10%20171637.png?alt=media&token=d979b5b3-0d0b-47da-a72c-2975caf52acd";
    return image_url;
}

// 환자 방명록 모아보기 페이지 반환
exports.listAllGuestbooks = async (req, res) => {
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
            return;
        }

        // 접근 권한 확인
        if (loginRole === 'counselor' || (loginRole === 'patient' && loginId == patientUser.patient_id)) {
            // 페이지네이션 처리
            const limit = 10; // 한 페이지에 보여줄 방명록 수
            const totalGuestbooks = await GuestbookModel.countByPatientId(patientUser.patient_id);
            const totalPages = Math.ceil(totalGuestbooks / limit);

            let currentPage = req.query.page ? parseInt(req.query.page) : 1;   // URL의 쿼리 매개변수 중 page 값을 가져옴 
            const guestbooks = await GuestbookModel.findAllByPatientIdWithPagination(patientUser.patient_id, currentPage, limit);


            // 각 방명록 항목에 대해 상담사의 닉네임, 프로필 이미지 가져오기
            for (let guestbook of guestbooks) {
                const counselor = await UserModel.getCounselorByCounselorId(guestbook.counselor_id);
                guestbook.counselorId = counselor ? counselor.id : "Unknown";
                guestbook.counselorNickname = counselor ? counselor.nickname : "Unknown";
                guestbook.counselorProfilePicture = counselor ? counselor.profile_picture : null;
            }

            // 렌더링
            res.render("profile/guestbook.ejs", { 
                patientUser: patientUser, 
                type: 'patient', 
                guestbooks: guestbooks,
                currentPage: currentPage,
                totalPages: totalPages,
                loginRole: loginRole
            });
        } else {
            res.status(403).send("접근 권한이 없습니다.");
        }

    } catch (error) {
        console.log("listAllGuestbooks 오류:", error);
        res.status(500).send("서버 오류가 발생했습니다.");
    }

}


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

    try {
        // 렌더링
        res.render("profile/setting.ejs", { page: 'passwordChange' });
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
            await UserModel.removePatient(loginId);
        } else if (loginRole === 'counselor') {
            await UserModel.removeCounselor(loginId);
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

        // console.log(Percentages);
        // console.log(monthlyPercentages);



        res.render('profile/emotion-chart', 
            {patientUser, type: 'patient',
            lineChartEmotionData: Data, 
            doughnutChartEmotionData: Percentages,
            barChartData: monthlyPercentages,
            descriptionEmotions
        });
    } catch (error) {
        console.error("newDiary 오류:", error);
        res.status(500).send("서버 오류가 발생했습니다.");
    }
}