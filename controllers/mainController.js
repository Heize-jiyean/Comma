const DiaryModel = require('../models/Diary');
const UserModel = require('../models/User');
const ArticleModel = require('../models/Article');


function setDefaultImage(image_url) {
    if (image_url == null) image_url = "https://firebasestorage.googleapis.com/v0/b/comma-5a85c.appspot.com/o/images%2F%EC%8A%A4%ED%81%AC%EB%A6%B0%EC%83%B7%202024-07-10%20171637.png?alt=media&token=d979b5b3-0d0b-47da-a72c-2975caf52acd";
    return image_url;
}

// 환자 메인화면
exports.main_patient = async (req, res) => {
    try {
        // 환자 정보 가져오기
        const patientId = req.session.user.id;
        const patientUser = await UserModel.getPatientByPatientId(patientId);
        
        // 데이터 불러오기
        const Data = await DiaryModel.getEmotionData(patientUser.patient_id);

        //const totalPages = Math.ceil( await DiaryModel.countOfFindByPatientId(patientUser.patient_id, 'patient') / 9);
        let currentPage = req.query.page ? parseInt(req.query.page) : 1;
        let Previews = await DiaryModel.PreviewfindByPatientId(currentPage, patientUser.patient_id, 'patient', 3);

        if (Previews) {
            Previews.forEach(preview => {
                preview.image_url = setDefaultImage(preview.image_url);
            });
        }

        // 추천아티클 
        let RecommendPreviews = null;
        if (req.session.user && req.session.user.role == 'patient') {
            RecommendPreviews = await ArticleModel.RecommendTop3_like(req.session.user.id);

            if (RecommendPreviews) {
                RecommendPreviews.forEach(preview => {
                    preview.thumbnail_url = setDefaultImage(preview.thumbnail_url);
                });
            }
        }

        res.render('main-patient', {patientUser, lineChartEmotionData: Data, Previews, currentPage, totalPages: 0 , RecommendPreviews});
    } catch (error) {
        console.error("main_patient 오류:", error);
        res.status(500).send("서버 오류가 발생했습니다.");
    }
}

// 상담사 메인화면 -> /diary
exports.main_counselor = async (req, res) => {
    try {
        res.redirect('/diary'); 
    } catch (error) {
        console.error("main_patient 오류:", error);
        res.status(500).send("서버 오류가 발생했습니다.");
    }
}

// 비회원 메인화면
exports.main = async (req, res) => {
    try {
        res.render('main');
    } catch (error) {
        console.error("main 오류:", error);
        res.status(500).send("서버 오류가 발생했습니다.");
    }
}