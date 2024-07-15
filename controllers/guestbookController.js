const GuestbookModel = require('../models/Guestbook');
const UserModel = require('../models/User'); // 필요한 경우

// 방명록 작성 페이지 반환
exports.new = async (req, res) => {
    try {
        const patientNickname = req.params.patientNickname; // URL에서 환자 닉네임 가져오기
        const patientUser = await UserModel.getPatientByNickname(patientNickname); // 환자 정보 가져오기

        res.render('guestbook/new.ejs', { patientUser: patientUser });
    } catch (error) {
        console.error("일기 작성 페이지 반환 오류:", error);
        res.status(500).send("서버 오류가 발생했습니다.");
    }
}

// 방명록 작성 내용 등록
exports.register = async (req, res) => {
    try {
        const { guestbookData } = req.body;
        console.log(guestbookData);

        const patientNickname = req.params.patientNickname; // URL에서 환자 닉네임 가져오기
        const patientUser = await UserModel.getPatientByNickname(patientNickname);

        const counselorId = 1;  // TODO: 실제 값으로 바꿔주기

        newGuestbookData = {
            patient_id: patientUser.patient_id,
            counselor_id: counselorId,
            ...guestbookData
        }

        const savedGuestbookId = await GuestbookModel.register(newGuestbookData);
        // return res.json({ success: true, redirect: `/guestbook/${savedGuestbookId}` }); // TODO: 방명록 상세 페이지로 이동
        return res.json({ success: true, redirect: `/` });
    } catch (error) {
        console.error("registerGuestbook 오류:", error);
        res.status(500).send("서버 오류가 발생했습니다.");
    }
}