const GuestbookModel = require('../models/Guestbook');
const UserModel = require('../models/User'); 
const AccessCheck = require('../utils/authUtils');

// 방명록 작성 페이지 반환
exports.new = async (req, res) => {
    // 로그인하지 않은 사용자가 접근할 경우
    if (!AccessCheck.isUserAuthenticated(req.session.user)) {
        const referer = req.get('Referer') || '/';
        return res.status(403).send(`<script>alert("권한이 없습니다."); window.location.href = "${referer}";</script>`);
    }

    // 로그인한 사용자
    const loginRole = req.session.user.role;

    try {
        // 환자 정보 가져오기
        const patientId = req.params.patientId; 
        const patientUser = await UserModel.getPatientByUserId(patientId); 

        // 없는 환자일 경우
        if (!patientUser) {
            res.render("/");    // TODO: 없는 환자인 경우 띄울 페이지
            console.log("없는 환자임");
        }

        if (loginRole === 'counselor') {
            res.render('guestbook/new.ejs', { patientUser: patientUser });
        } else {
            res.status(403).send("접근 권한이 없습니다.");
        }

        
    } catch (error) {
        console.error("일기 작성 페이지 반환 오류:", error);
        res.status(500).send("서버 오류가 발생했습니다.");
    }
}

// 방명록 작성 내용 등록
exports.register = async (req, res) => {
    const loginId = req.session.user.id;

    try {
        const { guestbookData } = req.body;
        console.log(guestbookData);

        const patientId = req.params.patientId; 
        const patientUser = await UserModel.getPatientByUserId(patientId);

        const counselorId = loginId;

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
        let patientUserId = await GuestbookModel.getPatientIdByGuestbookId(guestbookId);  // 새로운 함수 호출

        if (!guestbook) {
            return res.status(404).send("방명록을 찾을 수 없습니다.");
        }

        let counselor = await GuestbookModel.getCounselorID(guestbook.counselor_id);
        guestbook.author_name = counselor.nickname + ' 상담사';
        guestbook.author_profile_image = counselor.profile_picture;

        const loggedInUser = req.session.user;
        const isOwner = loggedInUser && (loggedInUser.role === 'counselor' && loggedInUser.id === guestbook.counselor_id);

        res.render('guestbook/view', {
            guestbook,
            isOwner,
            loggedInUser,
            patientUserId  // 뷰로 환자의 ID 전달
        });
    } catch (error) {
        console.error("viewGuestbook 오류:", error);
        res.status(500).send("서버 오류가 발생했습니다.");
    }
};


// 방명록 수정 페이지 반환
exports.edit = async (req, res) => {
    try {
        const guestbookId = req.params.guestbookId;
        let guestbook = await GuestbookModel.findById(guestbookId);

        if (!guestbook) {
            return res.status(404).send("방명록을 찾을 수 없습니다.");
        }

        res.render('guestbook/edit', {
            guestbook
        });
    } catch (error) {
        console.error("editGuestbook 오류:", error);
        res.status(500).send("서버 오류가 발생했습니다.");
    }
};

// 방명록 수정 처리
exports.update = async (req, res) => {
    try {
        const guestbookId = req.params.guestbookId;
        const { title, content } = req.body;

        let result = await GuestbookModel.update(guestbookId, { title, content });

        if (result) {
            res.json({ success: true, redirect: `/guestbook/${guestbookId}` });
        } else {
            res.status(404).send("업데이트할 방명록을 찾을 수 없습니다.");
        }
    } catch (error) {
        console.error("updateGuestbook 오류:", error);
        res.status(500).send("서버 오류가 발생했습니다.");
    }
};




// 방명록 삭제하기
exports.delete = async (req, res) => {
    try {
        const guestbookId = req.params.guestbookId;
        const guestbook = await GuestbookModel.findById(guestbookId); // 방명록 정보를 먼저 조회
        if (!guestbook) {
            res.status(404).send("삭제할 방명록을 찾을 수 없습니다.");
            return;
        }

        const patientUserId = await GuestbookModel.getPatientIdByGuestbookId(guestbookId);  // 방명록에서 patient_id 추출
        const deletionResult = await GuestbookModel.delete(guestbookId);
        
        if (deletionResult > 0) {
            if (patientUserId) {
                return res.json({success: true, redirect: `/profile/patient/${patientUserId}/guestbooks`});
            } else {
                res.status(404).send("환자 정보를 찾을 수 없습니다.");
            }
        } else {
            res.status(404).send("삭제할 방명록을 찾을 수 없습니다.");
        }
    } catch (error) {
        console.error("deleteGuestbook 오류:", error);
        res.status(500).send("서버 오류가 발생했습니다.");
    }
};


