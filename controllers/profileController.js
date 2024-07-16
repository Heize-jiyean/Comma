const UserModel = require('../models/User');
const DiaryModel = require('../models/Diary')
const GuestbookModel = require('../models/Guestbook');

// 환자 프로필 페이지 반환
exports.patientProfilePage = async (req, res) => {
    const loginId = "dain09";  // TODO: 세션 처리
    res.locals.loginId = loginId;

    try {
        // 환자 정보 가져오기
        const patientNickname = req.params.patientNickname;
        const patientUser = await UserModel.getPatientByNickname(patientNickname);

        // 없는 환자일 경우
        if (!patientUser) {
            res.render("/");    // TODO: 없는 환자인 경우 띄울 페이지
            return;
        }

        // 환자가 작성한 일기 가져오기
        const diaries = await DiaryModel.findLatestByPatientId(patientUser.patient_id);

        // 환자에게 작성된 방명록 가져오기
        const guestbooks = await GuestbookModel.findLatestByPatientId(patientUser.patient_id);
        
        // 각 방명록 항목에 대해 상담사의 닉네임 가져오기
        for (let guestbook of guestbooks) {
            const counselor = await UserModel.getCounselorById(guestbook.counselor_id);
            guestbook.counselor_name = counselor ? counselor.name : "Unknown";
            guestbook.counselor_profile_picture = counselor ? counselor.profile_picture : null;
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
        const counselorNickname = req.params.counselorNickname;
        const counselorUser = await UserModel.getCounselorByNickname(counselorNickname);

        // 없는 상담사일 경우
        if (!counselorUser) {
            res.render("/");
            return;
        }

        // 상담사가 작성한 방명록 가져오기
        const guestbooks = await GuestbookModel.findAllByCounselorId(counselorUser.counselor_id);

        // 렌더링
        res.render("profile/counselor.ejs", { 
            counselorUser: counselorUser, 
            type: 'counselor',
            guestbooks: guestbooks
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
        const patientNickname = req.params.patientNickname;
        const patientUser = await UserModel.getPatientByNickname(patientNickname);
        if (!patientUser) {
            res.render("/");    // TODO: 없는 환자인 경우 띄울 페이지
            return;
        }

        // 일기
        const totalPages = Math.ceil( await DiaryModel.countOfFindAll() / 9);
        let currentPage = req.query.page ? parseInt(req.query.page) : 1;
        let Previews = await DiaryModel.findAll(currentPage);

        Previews.forEach(preview => {
            preview.image_url = setDefaultImage(preview.image_url);
            // preview.profile_picture = 프로필 기본이미지 설정
        });

        res.render('profile/diary', {patientUser: patientUser, type: 'patient', 
                                        Previews, currentPage, totalPages});
    } catch (error) {
        console.error("listAllDiaries 오류:", error);
        res.status(500).send("서버 오류가 발생했습니다.");
    }
}

function setDefaultImage(image_url) {
    if (image_url == null) image_url = "https://firebasestorage.googleapis.com/v0/b/comma-5a85c.appspot.com/o/images%2F%EC%8A%A4%ED%81%AC%EB%A6%B0%EC%83%B7%202024-07-10%20171637.png?alt=media&token=d979b5b3-0d0b-47da-a72c-2975caf52acd";
    return image_url;
}

// 환자 일기 방명록 모아보기 페이지 반환
exports.listAllGuestbooks = async (req, res) => {
    try {
        // 환자 정보 가져오기
        const patientNickname = req.params.patientNickname;
        const patientUser = await UserModel.getPatientByNickname(patientNickname);

        // 없는 환자일 경우
        if (!patientUser) {
            res.render("/");    // TODO: 없는 환자인 경우 띄울 페이지
            return;
        }

        // 환자에게 작성된 방명록 가져오기
        const guestbooks = await GuestbookModel.findAllByPatientId(patientUser.patient_id);
        
        // 각 방명록 항목에 대해 상담사의 닉네임 가져오기
        for (let guestbook of guestbooks) {
            const counselor = await UserModel.getCounselorById(guestbook.counselor_id);
            guestbook.counselor_name = counselor ? counselor.name : "Unknown";
            guestbook.counselor_profile_picture = counselor ? counselor.profile_picture : null;
        }

        // 렌더링
        res.render("profile/guestbook.ejs", { 
            patientUser: patientUser, 
            type: 'patient', 
            guestbooks: guestbooks
        });


    } catch (error) {
        console.log("listAllGuestbooks 오류:", error);
        res.status(500).send("서버 오류가 발생했습니다.");
    }

}