const GuestbookModel = require('../models/Guestbook');
const UserModel = require('../models/User'); 

// 방명록 작성 페이지 반환
exports.new = async (req, res) => {
    try {
        // 환자 정보 가져오기
        const patientId = req.params.patientId; 
        const patientUser = await UserModel.getPatientByUserId(patientId); 

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

        const patientId = req.params.patientId; 
        const patientUser = await UserModel.getPatientByUserId(patientId);

        const counselorId = 2;  // TODO: 실제 값으로 바꿔주기

        newGuestbookData = {
            patient_id: patientUser.patient_id,
            counselor_id: counselorId,
            ...guestbookData
        }

        const savedGuestbookId = await GuestbookModel.register(newGuestbookData);
        return res.json({ success: true, redirect: `/guestbook/${savedGuestbookId}` });
    } catch (error) {
        console.error("registerGuestbook 오류:", error);
        res.status(500).send("서버 오류가 발생했습니다.");
    }
}

// 방명록 상세조회
exports.view = async (req, res) => {
    try {
        const guestbookId = req.params.guestbookId; 
        let guestbook = await GuestbookModel.findById(guestbookId); 
        
        if (guestbook) {
            let profile = await GuestbookModel.getCounselorID(guestbook.counselor_id);
            
            guestbook.author_name = profile.name + ' 상담사';
            guestbook.author_profile_image = profile.profile_picture; // 프로필 이미지 추가

            res.render('guestbook/view', { guestbook });
        } else {
            res.status(404).send("방명록을 찾을 수 없습니다.");
        }
    } catch (error) {
        console.error("viewGuestbook 오류:", error);
        res.status(500).send("서버 오류가 발생했습니다.");
    }
}
