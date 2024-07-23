const UserModel = require('../models/User');
const DiaryModel = require('../models/Diary')
const GuestbookModel = require('../models/Guestbook');
const AccessCheck = require('../middlewares/auth');


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

// 감정 차트 반환페이지 
exports.charts = async (req, res) => {
    try {
        // 환자 정보 가져오기
        const patientId = req.params.patientId;
        const patientUser = await UserModel.getPatientByUserId(patientId);

        //임시 그래프 데이터
        const recentData = [
            { date: '2024-07-01', joy: 14, surprise: 24, anger: 21, anxiety: 9, hurt: 12, sadness: 18 },
            { date: '2024-07-02', joy: 27, surprise: 17, anger: 23, anxiety: 26, hurt: 79, sadness: 24 },
            { date: '2024-07-03', joy: 21, surprise: 20, anger: 26, anxiety: 25, hurt: 74, sadness: 12 },
            { date: '2024-07-04', joy: 13, surprise: 19, anger: 20, anxiety: 14, hurt: 50, sadness: 20 },
            { date: '2024-07-05', joy: 22, surprise: 15, anger: 12, anxiety: 18, hurt: 66, sadness: 29 },
            { date: '2024-07-06', joy: 25, surprise: 28, anger: 15, anxiety: 22, hurt: 77, sadness: 18 },
            { date: '2024-07-07', joy: 18, surprise: 33, anger: 24, anxiety: 15, hurt: 12, sadness: 16 },
            { date: '2024-07-08', joy: 17, surprise: 44, anger: 11, anxiety: 9, hurt: 42, sadness: 21 },
            { date: '2024-07-09', joy: 16, surprise: 12, anger: 13, anxiety: 10, hurt: 61, sadness: 28 },
            { date: '2024-07-10', joy: 20, surprise: 55, anger: 15, anxiety: 44, hurt: 52, sadness: 23 },
            { date: '2024-07-11', joy: 15, surprise: 25, anger: 18, anxiety: 26, hurt: 63, sadness: 27 },
            { date: '2024-07-12', joy: 28, surprise: 14, anger: 27, anxiety: 0, hurt: 39, sadness: 22 },
            { date: '2024-07-13', joy: 21, surprise: 21, anger: 29, anxiety: 14, hurt: 20, sadness: 11 },
            { date: '2024-07-14', joy: 26, surprise: 10, anger: 19, anxiety: 21, hurt: 15, sadness: 13 },
            { date: '2024-07-15', joy: 48, surprise: 16, anger: 22, anxiety: 11, hurt: 27, sadness: 19 },
            { date: '2024-07-16', joy: 13, surprise: 39, anger: 20, anxiety: 15, hurt: 8, sadness: 26 },
            { date: '2024-07-17', joy: 19, surprise: 22, anger: 17, anxiety: 18, hurt: 81, sadness: 14 },
            { date: '2024-07-18', joy: 11, surprise: 26, anger: 12, anxiety: 14, hurt: 69, sadness: 24 },
            { date: '2024-07-19', joy: 17, surprise: 28, anger: 22, anxiety: 5, hurt: 79, sadness: 16 },
            { date: '2024-07-20', joy: 12, surprise: 57, anger: 29, anxiety: 0, hurt: 55, sadness: 28 },
            { date: '2024-07-21', joy: 25, surprise: 66, anger: 15, anxiety: 3, hurt: 76, sadness: 21 },
            { date: '2024-07-22', joy: 22, surprise: 20, anger: 16, anxiety: 7, hurt: 74, sadness: 19 },
            { date: '2024-07-23', joy: 19, surprise: 54, anger: 25, anxiety: 16, hurt: 57, sadness: 11 },
            { date: '2024-07-24', joy: 14, surprise: 15, anger: 14, anxiety: 20, hurt: 68, sadness: 12 },
            { date: '2024-07-25', joy: 26, surprise: 28, anger: 21, anxiety: 1, hurt: 80, sadness: 25 },
            { date: '2024-07-26', joy: 28, surprise: 56, anger: 23, anxiety: 15, hurt: 13, sadness: 21 },
            { date: '2024-07-27', joy: 18, surprise: 52, anger: 17, anxiety: 20, hurt: 12, sadness: 24 },
            { date: '2024-07-28', joy: 20, surprise: 18, anger: 26, anxiety: 16, hurt: 71, sadness: 14 },
            { date: '2024-07-29', joy: 27, surprise: 14, anger: 12, anxiety: 19, hurt: 15, sadness: 23 },
            { date: '2024-07-30', joy: 13, surprise: 16, anger: 20, anxiety: 14, hurt: 28, sadness: 19 },
            { date: '2024-07-31', joy: 29, surprise: 20, anger: 11, anxiety: 18, hurt: 27, sadness: 15 }
        ];


        const total = { joy: 0, surprise: 0, anger: 0, anxiety: 0, hurt: 0, sadness: 0 };
        recentData.forEach(entry => {
            total.joy += entry.joy;
            total.surprise += entry.surprise;
            total.anger += entry.anger;
            total.anxiety += entry.anxiety;
            total.hurt += entry.hurt;
            total.sadness += entry.sadness;
        });
    
        const totalSum = total.joy + total.surprise + total.anger + total.anxiety + total.hurt + total.sadness;
        const totalPercentages = {
            joy: (total.joy / totalSum) * 100,
            surprise: (total.surprise / totalSum) * 100,
            anger: (total.anger / totalSum) * 100,
            anxiety: (total.anxiety / totalSum) * 100,
            hurt: (total.hurt / totalSum) * 100,
            sadness: (total.sadness / totalSum) * 100
        };

        const emotionInfo = {
            joy: { color: '#FFAFCC', label: '기쁨' },
            surprise: { color: '#E9DF00', label: '당황' },
            anger: { color: '#FF4A4A', label: '분노' },
            anxiety: { color: '#FF9B52', label: '불안' },
            hurt: { color: '#62CC79', label: '상처' },
            sadness: { color: '#8588D5', label: '슬픔' }
        };

        // 감정 데이터 정렬 및 추출
        const sortedEmotions = Object.keys(totalPercentages)
        .map(key => ({
            emotion: key,
            percentage: Math.round(totalPercentages[key]), // 퍼센트를 정수로 변환
            color: emotionInfo[key].color,
            label: emotionInfo[key].label
        }))
        .sort((a, b) => b.percentage - a.percentage);

        // 상위 3개, 하위 1개 추출
        const topThreeEmotions = sortedEmotions.slice(0, 3);
        const leastEmotion = sortedEmotions[sortedEmotions.length - 1];

        // 클라이언트에 전송할 데이터 구성
        const descriptionEmotions = {
            topThree: topThreeEmotions,
            least: leastEmotion
        };


        res.render('profile/emotion-chart', 
            {patientUser, type: 'patient',
            lineChartEmotionData: recentData, 
            doughnutChartEmotionData: totalPercentages,
            descriptionEmotions
        });
    } catch (error) {
        console.error("newDiary 오류:", error);
        res.status(500).send("서버 오류가 발생했습니다.");
    }
}