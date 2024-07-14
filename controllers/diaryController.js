const diaryModel = require('../models/Diary');


exports.new = async (req, res) => {
    try {
        
        // 예외 처리 


        res.render('diary/new');
    } catch (error) {
        console.error("newDiary 오류:", error);
        res.status(500).send("서버 오류가 발생했습니다.");
    }
}

exports.register = async (req, res) => {
    try {
        const { diaryData } = req.body;
        console.log(diaryData);

        // 감정분석
        // 임시 감정 분석 수치
        diaryData.joy = 10.00; diaryData.surprise = 20.00; diaryData.anger = 30.00; 
        diaryData.anxiety = 10.00; diaryData.hurt = 10.00; diaryData.sadness = 20.00;

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
        // 회원정보 불러오기 profileModel.findById(diary.patient_id);
        console.log(diary);

        if (diary) {
            // 유저 확인 
            if (diary.is_visible) {
                // 작성한 회원 본인 && 상담사들
            } else {
                // 작성한 회원 본인
            }

            // 기본이미지 설정
            diary.image_url = setDefaultImage(diary.image_url);

            res.render('diary/view', {diary});
        }
    } catch (error) {
        console.error("viewDiary 오류:", error);
        res.status(500).send("서버 오류가 발생했습니다.");
    }
}

exports.toggleVisibility = async (req, res) => {
    try {
        const diaryId = req.params.diaryId;

        // 유저 확인 (게시글 작성 유저 == 요청 유저)

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

        // 로그인 여부 확인 && 유저 확인
89
        // 스토리지 이미지 삭제
        const imageUrl = await diaryModel.findImageUrlById(diaryId);
        if (imageUrl) {
            // URL parsing
            const parsedUrl = new URL(imageUrl);
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

        // redirect
        return res.status(200).send("삭제 성공");
    } catch (error) {
        console.error("deleteDiary 오류:", error);
        res.status(500).send("서버 오류가 발생했습니다.");
    }
}

exports.listAllDiaries = async (req, res) => {
    try {
        const totalPages = Math.ceil( await diaryModel.countOfFindAll() / 9);
        let currentPage = req.query.page ? parseInt(req.query.page) : 1;
        let Previews = await diaryModel.findAll(currentPage);

        Previews.forEach(preview => {
            preview.image_url = setDefaultImage(preview.image_url);
            // preview.profile_picture = 프로필 기본이미지 설정
        });

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
