const UserModel = require('../models/User');
const DiaryModel = require('../models/Diary')
const GuestbookModel = require('../models/Guestbook');
const AccessCheck = require('../utils/authUtils');
const EmotionData = require('../utils/emotionUtils');


// 환자 프로필 페이지 반환
exports.patientProfilePage = async (req, res) => {
    const loginId = "dain09";  // TODO: 세션 처리
    res.locals.loginId = loginId;

    try {
        // 환자 정보 가져오기
        const patientId = req.params.patientId;
        const patientUser = await UserModel.getPatientByUserId(patientId);

        // 없는 환자일 경우
        if (!patientUser) {
            res.render("/");    // TODO: 없는 환자인 경우 띄울 페이지
            return;
        }

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
            guestbooks: guestbooks
        });
    } catch (error) {
        console.error("환자 프로필 반환 오류:", error);
        res.status(500).send("서버 오류가 발생했습니다.");
    };
}

// 상담사 프로필 페이지 반환
exports.counselorProfilePage = async (req, res) => {
    const loginId = "eunwoo";
    res.locals.loginId = loginId;

    try {
        // 상담사 정보 가져오기
        const counselorId = req.params.counselorId;
        const counselorUser = await UserModel.getCounselorByUserId(counselorId);

        // 없는 상담사일 경우
        if (!counselorUser) {
            res.render("/");
            return;
        }

        // 페이지네이션 처리
        const limit = 10; // 한 페이지에 보여줄 방명록 수
        const totalGuestbooks = await GuestbookModel.countByCounselorId(counselorUser.counselor_id);
        const totalPages = Math.ceil(totalGuestbooks / limit);

        let currentPage = req.query.page ? parseInt(req.query.page) : 1;   // URL의 쿼리 매개변수 중 page 값을 가져옴 
        const guestbooks = await GuestbookModel.findAllByCounselorIdWithPagination(counselorUser.counselor_id, currentPage, limit);

        // 렌더링
        res.render("profile/counselor.ejs", { 
            counselorUser: counselorUser, 
            type: 'counselor',
            guestbooks: guestbooks,
            currentPage: currentPage,
            totalPages: totalPages,
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
    try {
        // 환자 정보 가져오기
        const patientId = req.params.patientId;
        const patientUser = await UserModel.getPatientByUserId(patientId);

        // 없는 환자일 경우
        if (!patientUser) {
            res.render("/");    // TODO: 없는 환자인 경우 띄울 페이지
            return;
        }

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
        });


    } catch (error) {
        console.log("listAllGuestbooks 오류:", error);
        res.status(500).send("서버 오류가 발생했습니다.");
    }

}


// 프로필 수정 - 프로필 편집 페이지 밚환
exports.profileEditPage = async(req, res) => {
    try {
        
        // 렌더링
        res.render("profile/setting.ejs", { page: 'profileEdit' });

    } catch (error) {
        console.error("프로필 수정 - 프로필 편집 페이지 반환 오류:", error);
        res.status(500).send("서버 오류가 발생했습니다.");
    }
}

// 프로필 수정 - 비밀번호 변경 페이지 반환
exports.passwordChangePage = async(req, res) => {
    try {
        // 렌더링
        res.render("profile/setting.ejs", { page: 'passwordChange' });
    } catch (error) {
        console.log("프로필 수정 - 비밀번호 변경 페이지 반환 오류: ", error);
        res.status(500).send("서버 오류가 발생했습니다.");
    }
}

// 프로필 수정 -탈퇴 페이지 밚환
exports.accounttRemovalPage = async(req, res) => {
    try {
        // 렌더링
        res.render("profile/setting.ejs", { page: 'accountRemoval' });
    } catch (error) {
        console.log("프로필 수정 - 탈퇴 페이지 반환 오류: ", error);
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