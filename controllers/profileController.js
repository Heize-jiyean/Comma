const UserModel = require('../models/User');
const DiaryModel = require('../models/Diary')
const GuestbookModel = require('../models/Guestbook');
const AccessCheck = require('../utils/authUtils');
const EmotionData = require('../utils/emotionUtils');


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

        // 최근 30일 감정데이터 불러오기 
        const recentData = await DiaryModel.getEmotionData(patientUser.patient_id);
        //임시 그래프 데이터
        // const recentData = [
        //     { date: '2024-07-01', joy: 14, surprise: 24, anger: 21, anxiety: 9, hurt: 12, sadness: 18 },
        //     { date: '2024-07-02', joy: 27, surprise: 17, anger: 23, anxiety: 26, hurt: 79, sadness: 24 },
        //     { date: '2024-07-03', joy: 21, surprise: 20, anger: 26, anxiety: 25, hurt: 74, sadness: 12 },
        //     { date: '2024-07-04', joy: 13, surprise: 19, anger: 20, anxiety: 14, hurt: 50, sadness: 20 },
        //     { date: '2024-07-05', joy: 22, surprise: 15, anger: 12, anxiety: 18, hurt: 66, sadness: 29 },
        //     { date: '2024-07-06', joy: 25, surprise: 28, anger: 15, anxiety: 22, hurt: 77, sadness: 18 },
        //     { date: '2024-07-07', joy: 18, surprise: 33, anger: 24, anxiety: 15, hurt: 12, sadness: 16 },
        //     { date: '2024-07-08', joy: 17, surprise: 44, anger: 11, anxiety: 9, hurt: 42, sadness: 21 },
        //     { date: '2024-07-09', joy: 16, surprise: 12, anger: 13, anxiety: 10, hurt: 61, sadness: 28 },
        //     { date: '2024-07-10', joy: 20, surprise: 55, anger: 15, anxiety: 44, hurt: 52, sadness: 23 },
        //     { date: '2024-07-11', joy: 15, surprise: 25, anger: 18, anxiety: 26, hurt: 63, sadness: 27 },
        //     { date: '2024-07-12', joy: 28, surprise: 14, anger: 27, anxiety: 0, hurt: 39, sadness: 22 },
        //     { date: '2024-07-13', joy: 21, surprise: 21, anger: 29, anxiety: 14, hurt: 20, sadness: 11 },
        //     { date: '2024-07-14', joy: 26, surprise: 10, anger: 19, anxiety: 21, hurt: 15, sadness: 13 },
        //     { date: '2024-07-15', joy: 48, surprise: 16, anger: 22, anxiety: 11, hurt: 27, sadness: 19 },
        //     { date: '2024-07-16', joy: 13, surprise: 39, anger: 20, anxiety: 15, hurt: 8, sadness: 26 },
        //     { date: '2024-07-17', joy: 19, surprise: 22, anger: 17, anxiety: 18, hurt: 81, sadness: 14 },
        //     { date: '2024-07-18', joy: 11, surprise: 26, anger: 12, anxiety: 14, hurt: 69, sadness: 24 },
        //     { date: '2024-07-19', joy: 17, surprise: 28, anger: 22, anxiety: 5, hurt: 79, sadness: 16 },
        //     { date: '2024-07-20', joy: 12, surprise: 57, anger: 29, anxiety: 0, hurt: 55, sadness: 28 },
        //     { date: '2024-07-21', joy: 25, surprise: 66, anger: 15, anxiety: 3, hurt: 76, sadness: 21 },
        //     { date: '2024-07-22', joy: 22, surprise: 20, anger: 16, anxiety: 7, hurt: 74, sadness: 19 },
        //     { date: '2024-07-23', joy: 19, surprise: 54, anger: 25, anxiety: 16, hurt: 57, sadness: 11 },
        //     { date: '2024-07-24', joy: 14, surprise: 15, anger: 14, anxiety: 20, hurt: 68, sadness: 12 },
        //     { date: '2024-07-25', joy: 26, surprise: 28, anger: 21, anxiety: 1, hurt: 80, sadness: 25 },
        //     { date: '2024-07-26', joy: 28, surprise: 56, anger: 23, anxiety: 15, hurt: 13, sadness: 21 },
        //     { date: '2024-07-27', joy: 18, surprise: 52, anger: 17, anxiety: 20, hurt: 12, sadness: 24 },
        //     { date: '2024-07-28', joy: 20, surprise: 18, anger: 26, anxiety: 16, hurt: 71, sadness: 14 },
        //     { date: '2024-07-29', joy: 27, surprise: 14, anger: 12, anxiety: 19, hurt: 15, sadness: 23 },
        //     { date: '2024-07-30', joy: 13, surprise: 16, anger: 20, anxiety: 14, hurt: 28, sadness: 19 },
        //     { date: '2024-07-31', joy: 29, surprise: 20, anger: 11, anxiety: 18, hurt: 27, sadness: 15 }
        // ];

        const Percentages = EmotionData.calculateEmotionPercentages(recentData);
        const descriptionEmotions = EmotionData.generateEmotionSummary(Percentages);
        const monthlyPercentages = EmotionData.calculateMonthlyEmotionPercentages(patientUser);


        res.render('profile/emotion-chart', 
            {patientUser, type: 'patient',
            lineChartEmotionData: recentData, 
            doughnutChartEmotionData: Percentages,
            barChartData: monthlyPercentages,
            descriptionEmotions
        });
    } catch (error) {
        console.error("newDiary 오류:", error);
        res.status(500).send("서버 오류가 발생했습니다.");
    }
}