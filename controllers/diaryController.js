const DiaryModel = require('../models/Diary');
const UserModel = require('../models/User');
const AccessCheck = require('../utils/authUtils');
const EmotionData = require('../utils/emotionUtils');
const ArticleModel = require('../models/Article');
const ArticleInteractionModel = require('../models/ArticleInteraction');
const axios = require('axios');

function setDefaultImage(image_url) {
    if (image_url == null) image_url = "https://firebasestorage.googleapis.com/v0/b/comma-5a85c.appspot.com/o/images%2F%EC%8A%A4%ED%81%AC%EB%A6%B0%EC%83%B7%202024-07-10%20171637.png?alt=media&token=d979b5b3-0d0b-47da-a72c-2975caf52acd";
    return image_url;
}

exports.new = async (req, res) => {
    try {
        if (req.session.user) {
            if (!AccessCheck.checkPatientRole(req.session.user.role)) {
                const referer = req.get('Referer') || '/';
                return res.status(403).send(`<script>alert("권한이 없습니다."); window.location.href = "${referer}";</script>`);
            }

            const patientId = req.session.user.id;
            const date = new Date();
            const todayDiary = await DiaryModel.findBypatientIdAndDate(patientId, date.getFullYear(), date.getMonth()+1, date.getDate());
            if (todayDiary) {
                const redirect = `/diary/${todayDiary.diary_id}`;
                return res.status(403).send(`<script>alert("이미 오늘의 일기가 있습니다."); window.location.href = "${redirect}";</script>`);
            }

            res.render('diary/new', {patientId});
        }
        else return res.render("login/login");
    } catch (error) {
        console.error("newDiary 오류:", error);
        res.status(500).send("서버 오류가 발생했습니다.");
    }
}


exports.register = async (req, res) => {
    try {
        if (req.session.user) {
            if (!AccessCheck.checkPatientRole(req.session.user.role)) {
                const referer = req.get('Referer') || '/';
                return res.status(403).send(`<script>alert("권한이 없습니다."); window.location.href = "${referer}";</script>`);
            }
            const { diaryData } = req.body;
    
            const savedDiaryId = await DiaryModel.register(diaryData);

            //추천 시스템 관련
            await axios.post('http://localhost:5000/embedding', { idx: 2, id: savedDiaryId, sentence: diaryData.title+diaryData.content });

            res.json({ success: true, redirect: `/diary/${savedDiaryId}` }); // 응답반환

            // 감정분석 후 WebSocket을 통해 메시지 전송
            EmotionData.analyzeAndNotify(diaryData.content, diaryData.title, savedDiaryId);
        }
        else return res.render("login/login");
    } catch (error) {
        console.error("registerDiary 오류:", error);
        res.status(500).send("서버 오류가 발생했습니다.");
    }
}

exports.view = async (req, res) => {
    try {
        const diaryId = req.params.diaryId;

        let diary = await DiaryModel.findById(diaryId); // const
        const patient = await UserModel.getPatientByPatientId(diary.patient_id); // ??Cannot read properties of null

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

            // 추천아티클 
            let RecommendPreviews = null;
            if (req.session.user && req.session.user.role == 'patient') {
                const likeData = await ArticleInteractionModel.findLikeByPatient(req.session.user.id);
                let response = await axios.post('http://localhost:5000/recommend', { likeId: likeData, idx: 2, id: diaryId });
                let RecommendID = response.data;
                RecommendPreviews = await ArticleModel.RecommendTop3(RecommendID);
    
                if (RecommendPreviews) {
                    RecommendPreviews.forEach(preview => {
                        preview.thumbnail_url = setDefaultImage(preview.thumbnail_url);
                    });
                }
            }

            res.render('diary/view', {diary, patient, role, RecommendPreviews});
        }
        else return res.render("login/login");
    } catch (error) {
        console.error("viewDiary 오류:", error);
        res.status(500).send("서버 오류가 발생했습니다.");
    }
}

exports.toggleVisibility = async (req, res) => {
    try {
        if (req.session.user) {
            const diaryId = req.params.diaryId;
            const diary = await DiaryModel.findById(diaryId); 

            if (!AccessCheck.checkPatientId(req.session.user.role, req.session.user.id, diary.patient_id)) {
                const referer = req.get('Referer') || '/';
                return res.status(403).send(`<script>alert("권한이 없습니다."); window.location.href = "${referer}";</script>`);
            } 
    
            await DiaryModel.toggleVisibility(diaryId);
    
            res.status(200).json({ success: true });
        }
        else return res.render("login/login");
    } catch (error) {
        console.error("registerDiary 오류:", error);
        res.status(500).send("서버 오류가 발생했습니다.");
    }
}

exports.delete = async (req, res) => {
    try {
        if (req.session.user) {
            const diaryId = req.params.diaryId;
            const diary = await DiaryModel.findById(diaryId); 
            const patient = await UserModel.getPatientByPatientId(diary.patient_id);
            
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
            await DiaryModel.delete(diaryId);

            // vector 삭제
            await axios.post('http://localhost:5000/delete_vector', { idx: 2, id: diaryId });
    
            // redirect
            return res.json({ success: true, redirect: `/profile/patient/${patient.id}/diaries` });
        }
        else return res.render("login/login");
    } catch (error) {
        console.error("deleteDiary 오류:", error);
        res.status(500).send("서버 오류가 발생했습니다.");
    }
}

// 일기 리스트
exports.list = async (req, res) => {
    try {
        if (req.session.user) {
            if (req.session.user.role == 'counselor') {
                const option = req.query.option ? req.query.option : "all";
                let currentPage = req.query.page ? parseInt(req.query.page) : 1;
        
                const totalPages = Math.ceil( await DiaryModel.countOfFindAll(option, 1) / 9);
                let Previews = await DiaryModel.PreviewfindAll(currentPage, option, req.session.user.id);
        
                if (Previews) {
                    Previews.forEach(preview => {
                        preview.image_url = setDefaultImage(preview.image_url);
                    });
                }
                
                res.render('main-counselor', {Previews, currentPage, totalPages});
            }
            else if (req.session.user.role == 'patient') {
                const patient_userID = req.session.user.custom_id;
                res.redirect(`/profile/patient/${patient_userID}/diaries`); 
            }
        }
        else return res.render("login/login");
    } catch (error) {
        console.error("listAllDiaries 오류:", error);
        res.status(500).send("서버 오류가 발생했습니다.");
    }
}

// 감정분석 상태 확인 컨트롤러
exports.checkStatus = async (req, res) => {
    const { diaryId } = req.params;
    try {
        const diary = await DiaryModel.findById(diaryId);
        if (diary.joy == 0.00 && diary.surprise == 0.00 && diary.anger == 0.00 && diary.anxiety == 0.00 && diary.hurt == 0.00 && diary.sadness == 0.00) {
            res.json({ analyzed: false });
        } else {
            res.json({ analyzed: true, diaryId: diaryId });
        }
    } catch (error) {
        console.error("Error checking diary status:", error);
        res.status(500).send("서버 오류가 발생했습니다.");
    }
};
