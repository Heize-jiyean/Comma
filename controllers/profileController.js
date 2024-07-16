const UserModel = require('../models/User');
const DiaryModel = require('../models/Diary')

// 환자 프로필 페이지 반환
exports.patientProfilePage = async (req, res) => {
    const loginId = "dain09";  // TODO: 세션 처리
    res.locals.loginId = loginId;
    const patientNickname = req.params.patientNickname;

    try {
        // 환자 정보 가져오기
        const patientUser = await UserModel.getPatientByNickname(patientNickname);
        if (!patientUser) {
            res.render("/");    // TODO: 없는 환자인 경우 띄울 페이지
            return;
        }

        // 작성한 일기 가져오기
        const diaries = await DiaryModel.findAllByPatientId(patientUser.patient_id);

        // 렌더링
        res.render("profile/patient.ejs", { patientUser: patientUser, type: 'patient', diaries: diaries})
    } catch {
        console.error("환자 프로필 반환 오류:", error);
        res.status(500).send("서버 오류가 발생했습니다.");
    };
}

// 상담사 프로필 페이지 반환
exports.counselorProfilePage = async (req, res) => {
    const loginId = "eunwoo";
    res.locals.loginId = loginId;
    const counselorNickname = req.params.counselorNickname;

    try {
        const counselorUser = await UserModel.getCounselorByNickname(counselorNickname);
        if (!counselorUser) {
            res.render("/");
            return;
        }
        res.render("profile/counselor.ejs", { counselorUser: counselorUser, type: 'counselor' });
    } catch {
        console.log("상담사 프로필 반환 오류", error);
        res.status(500).send("서버 오류가 발생했습니다.")
    }
}

// 환자 일기 모아보기
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
