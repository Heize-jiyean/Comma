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

        const savedDiaryId = await diaryModel.register(diaryData);
        return res.json({ success: true, redirect: `/diary/${savedDiaryId}` });
    } catch (error) {
        console.error("registerDiary 오류:", error);
        res.status(500).send("서버 오류가 발생했습니다.");
    }
}

exports.delete = async (req, res) => {
    try {
        const diaryID = req.params.diaryID;

        // 로그인 여부 확인 && 유저 확인

        // 스토리지 이미지 삭제
        const imageUrl = await diaryModel.findImageUrlById(diaryID);
        if (imageUrl) {
            // URL parsing
            const parsedUrl = new URL(imageUrl);
            const encodedFilePath = parsedUrl.pathname.split('/').pop();
            const filePath = decodeURIComponent(encodedFilePath);

            const admin = require('firebase-admin');
            const bucket = admin.storage().bucket('comma-5a85c.appspot.com'); 
            const file = bucket.file(filePath);

            try {
                await file.delete();  // 파일 삭제 실행
            } catch (error) {
                console.error("Failed to delete file", error);
                res.status(500).send({ error: "Failed to delete file: " + error.message });
            }
        }
        
        // DB diary 삭제
        await diaryModel.delete(diaryID);

        // redirect
        return res.status(200).send("삭제 성공");
    } catch (error) {
        console.error("deleteDiary 오류:", error);
        res.status(500).send("서버 오류가 발생했습니다.");
    }
}