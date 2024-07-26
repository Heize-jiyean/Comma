const diaryModel = require('../models/Diary');
const UserModel = require('../models/User');
const AccessCheck = require('../utils/authUtils');


exports.new = async (req, res) => {
    try {
        if (!AccessCheck.checkPatientRole(req.session.user.role)) {
            const referer = req.get('Referer') || '/';
            return res.status(403).send(`<script>alert("권한이 없습니다."); window.location.href = "${referer}";</script>`);
        }

        const patientId = req.session.user.id;
        const date = new Date();
        const todayDiary = await diaryModel.findBypatientIdAndDate(patientId, date.getFullYear(), date.getMonth()+1, date.getDate());
        if (todayDiary) {
            const redirect = `/diary/${todayDiary.diary_id}`;
            return res.status(403).send(`<script>alert("이미 오늘의 일기가 있습니다."); window.location.href = "${redirect}";</script>`);
        }

        res.render('diary/new', {patientId: req.session.user.id});
    } catch (error) {
        console.error("newDiary 오류:", error);
        res.status(500).send("서버 오류가 발생했습니다.");
    }
}

exports.register = async (req, res) => {
    try {
        if (!AccessCheck.checkPatientRole(req.session.user.role)) {
            const referer = req.get('Referer') || '/';
            return res.status(403).send(`<script>alert("권한이 없습니다."); window.location.href = "${referer}";</script>`);
        }

        const { diaryData } = req.body;

        // 감정분석

        const savedDiaryId = await diaryModel.register(diaryData);
        return res.json({ success: true, redirect: `/diary/${savedDiaryId}` });
    } catch (error) {
        console.error("registerDiary 오류:", error);
        res.status(500).send("서버 오류가 발생했습니다.");
    }
}

exports.view = async (req, res) => {
    try {
        const diaryId = req.params.diaryId;

        let diary = await diaryModel.findById(diaryId); // const
        const patient = await UserModel.getPatientById(diary.patient_id); // ??Cannot read properties of null

        if (!diary) return res.render("main");
        if (req.session.user) {
            const role = req.session.user.role;
        
            if (role == "patient") { // 환자 
                if (! AccessCheck.checkPatientId(role, req.session.user.id, diary.patient_id)) {
                    const referer = req.get('Referer') || '/';
                    return res.status(403).send(`<script>alert("권한이 없습니다."); window.location.href = "${referer}";</script>`);
                } 
            }
            else if (role == "counselor") { // 상담사 
                if (!diary.is_visible) { 
                    const referer = req.get('Referer') || '/';
                    return res.status(403).send(`<script>alert("권한이 없습니다."); window.location.href = "${referer}";</script>`);
                } // 다이어리 비공개
            }

            // 기본이미지 설정
            diary.image_url = setDefaultImage(diary.image_url);

            res.render('diary/view', {diary, patient, role});
        }
        else return res.render("login/login");
    } catch (error) {
        console.error("viewDiary 오류:", error);
        res.status(500).send("서버 오류가 발생했습니다.");
    }
}

exports.toggleVisibility = async (req, res) => {
    try {
        const diaryId = req.params.diaryId;
        const diary = await diaryModel.findById(diaryId); 

        if (!AccessCheck.checkPatientId(req.session.user.role, req.session.user.id, diary.patient_id)) {
            const referer = req.get('Referer') || '/';
            return res.status(403).send(`<script>alert("권한이 없습니다."); window.location.href = "${referer}";</script>`);
        } 

        await diaryModel.toggleVisibility(diaryId);

        res.status(200).json({ success: true });
    } catch (error) {
        console.error("registerDiary 오류:", error);
        res.status(500).send("서버 오류가 발생했습니다.");
    }
}

exports.delete = async (req, res) => {
    try {
        const diaryId = req.params.diaryId;
        const diary = await diaryModel.findById(diaryId); 
        const patient = await UserModel.getPatientById(diary.patient_id);
        
        if (!AccessCheck.checkPatientId(req.session.user.role, req.session.user.id, diary.patient_id)) {
            const referer = req.get('Referer') || '/';
            return res.status(403).send(`<script>alert("권한이 없습니다."); window.location.href = "${referer}";</script>`);
        } 

        // 스토리지 이미지 삭제
        if (diary.image_url) {
            // URL parsing
            const parsedUrl = new URL(diary.image_url);
            const encodedFilePath = parsedUrl.pathname.split('/').pop();
            const filePath = decodeURIComponent(encodedFilePath);

            const admin = require('firebase-admin');
            const bucket = admin.storage().bucket('comma-5a85c.appspot.com'); 
            const file = bucket.file(filePath);

            try {
                await file.delete();  // 파일 삭제
            } catch (error) {
                console.error("Failed to delete file", error);
                res.status(500).send({ error: "Failed to delete file: " + error.message });
            }
        }
        
        // DB diary 삭제
        await diaryModel.delete(diaryId);

        console.log(patient.id);
        // redirect
        return res.json({ success: true, redirect: `/profile/patient/${patient.id}/diaries` });
    } catch (error) {
        console.error("deleteDiary 오류:", error);
        res.status(500).send("서버 오류가 발생했습니다.");
    }
}

// 상담사 메인화면 일기 리스트
exports.listOfDiaries = async (req, res) => {
    try {
        // if (!AccessCheck.checkCounselorRole(req.session.user.role)) {
        //    const referer = req.get('Referer') || '/';
        //    return res.status(403).send(`<script>alert("권한이 없습니다."); window.location.href = "${referer}";</script>`);
        //}
        // 개발의 편의를 위해 잠시 주석처리해둠

        const option = req.query.option ? req.query.option : "all";
        let currentPage = req.query.page ? parseInt(req.query.page) : 1;

        const totalPages = Math.ceil( await diaryModel.countOfFindAll(option, 1) / 9);
        let Previews = await diaryModel.PreviewfindAll(currentPage, option, 1); // 임시 상담사 설정

        if (Previews) {
            Previews.forEach(preview => {
                preview.image_url = setDefaultImage(preview.image_url);
                // preview.profile_picture = 프로필 기본이미지 설정
            });
        }
        
        res.render('main-counselor', {Previews, currentPage, totalPages});
    } catch (error) {
        console.error("listAllDiaries 오류:", error);
        res.status(500).send("서버 오류가 발생했습니다.");
    }
}

function setDefaultImage(image_url) {
    if (image_url == null) image_url = "https://firebasestorage.googleapis.com/v0/b/comma-5a85c.appspot.com/o/images%2F%EC%8A%A4%ED%81%AC%EB%A6%B0%EC%83%B7%202024-07-10%20171637.png?alt=media&token=d979b5b3-0d0b-47da-a72c-2975caf52acd";
    return image_url;
}
