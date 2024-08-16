const GuestbookModel = require('../models/Guestbook');
const UserModel = require('../models/User'); 
const CommentModel = require('../models/Comment');
const AccessCheck = require('../utils/authUtils');

const DEFAULT_PROFILE_IMAGE = "https://firebasestorage.googleapis.com/v0/b/comma-5a85c.appspot.com/o/profile%2Fdefault_profile_photo.png?alt=media&token=7f2397c8-76f4-49b8-9c16-52b9ab242a9e";

function setDefaultImage(image_url) {
    if (!image_url || image_url.trim() === '') {
        return DEFAULT_PROFILE_IMAGE;
    }
    return image_url;
}


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

        const createdAtKST = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

        newGuestbookData = {
            patient_id: patientUser.patient_id,
            counselor_id: counselorId,
            ...guestbookData,
            created_at: createdAtKST
        };

        const savedGuestbookId = await GuestbookModel.register(newGuestbookData);
        return res.json({ success: true, redirect: `/guestbook/${savedGuestbookId}` });
    } catch (error) {
        console.error("registerGuestbook 오류:", error);
        res.status(500).send("서버 오류가 발생했습니다.");
    }
};


// 방명록 상세조회
const moment = require('moment-timezone');

exports.view = async (req, res) => {
    try {
        const guestbookId = req.params.guestbookId;
        let guestbook = await GuestbookModel.findById(guestbookId);
        let patientUserId = await GuestbookModel.getPatientIdByGuestbookId(guestbookId);
        let comments = await GuestbookModel.getCommentsByGuestbookId(guestbookId);

        if (!guestbook) {
            return res.status(404).send("방명록을 찾을 수 없습니다.");
        }

        let counselor = await GuestbookModel.getCounselorID(guestbook.counselor_id);
        guestbook.author_name = counselor.nickname + ' 상담사';
        guestbook.author_profile_image = setDefaultImage(counselor.profile_picture);  // 기본 이미지 설정

        // 댓글 작성자의 프로필 이미지 설정
        for (let comment of comments) {
            if (comment.author_role === 'counselor') {
                let counselor = await UserModel.getCounselorByCounselorId(comment.author_id);
                comment.author_image = setDefaultImage(counselor.profile_picture);
            } else if (comment.author_role === 'patient') {
                let patient = await UserModel.getPatientByPatientId(comment.author_id);
                comment.author_image = setDefaultImage(patient.profile_picture);
            }
        }

        const loggedInUser = req.session.user;
        const isOwner = loggedInUser && (loggedInUser.role === 'counselor' && loggedInUser.id === guestbook.counselor_id);
        const isPatient = loggedInUser && (loggedInUser.role === 'patient' && loggedInUser.id == guestbook.patient_id);

        res.render('guestbook/view', {
            guestbook,
            isOwner,
            loggedInUser,
            patientUserId,
            comments,
            isPatient
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

        // 상담사의 id를 가져오기 위해 counselor_id로 조회
        const counselor = await GuestbookModel.getCounselorID(guestbook.counselor_id);
        const counselorId = counselor.id;  // 한글/영문 상담사 id

        const deletionResult = await GuestbookModel.delete(guestbookId);
        
        if (deletionResult > 0) {
            return res.json({success: true, redirect: `/profile/counselor/${counselorId}/guestbooks`});
        } else {
            res.status(404).send("삭제할 방명록을 찾을 수 없습니다.");
        }
    } catch (error) {
        console.error("deleteGuestbook 오류:", error);
        res.status(500).send("서버 오류가 발생했습니다.");
    }
};


// 댓글작성
exports.addComment = async (req, res) => {
    try {
        const { guestbookId, content } = req.body;
        const authorId = req.session.user.id;
        const authorType = req.session.user.role;

        // UTC 시간을 KST로 변환
        const createdAtKST = moment().tz("Asia/Seoul").format("YYYY-MM-DD HH:mm:ss");

        if (authorType === 'counselor') {
            await CommentModel.createCounselorComment({ guestbook_id: guestbookId, author_id: authorId, content: content, created_at: createdAtKST });
        } else if (authorType === 'patient') {
            await CommentModel.createPatientComment({ guestbook_id: guestbookId, author_id: authorId, content: content, created_at: createdAtKST });
        }

        res.json({ success: true });
    } catch (error) {
        console.error("addComment 오류:", error);
        res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
    }
};




