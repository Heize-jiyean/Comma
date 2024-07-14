const UserModel = require('../models/User');

// 환자 프로필 페이지 반환
exports.patientProfilePage = async (req, res) => {
    const loginId = "dain09";  // TODO: 세션 처리
    res.locals.loginId = loginId;
    const patientNickname = req.params.patientNickname;

    try {
        const patientUser = await UserModel.getPatientByNickname(patientNickname);
        if (!patientUser) {
            res.render("/");    // TODO: 없는 환자인 경우 띄울 페이지
            return;
        }
        res.render("profile/patient.ejs", { patientUser: patientUser, type: 'patient'})
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

