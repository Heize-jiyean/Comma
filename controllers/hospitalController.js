const ReviewModel = require('../models/Review');
const hospitalModel = require('../models/Hospital');

// 병원 메인 페이지 로딩
exports.loadingMainPage = async (req, res) => {
    try {
        const reviews = await ReviewModel.getLatestReviews();
        const hospitals = await hospitalModel.getAllHospitals();
        console.log('Hospitals from controller:', hospitals); // 디버깅 로그 추가
        res.render('hospital/hospital', { 
            reviews: reviews,
            hospitals: hospitals, // JSON.stringify 제거
            naverMapClientId: process.env.NAVER_MAP_CLIENT_ID || '',
            hospitalName: ''
        });
    } catch (error) {
        console.error('Error loading main page:', error);
        res.status(500).send('Internal Server Error');
    }
};
// 병원 위치 로딩
exports.getHospitalLocation = async (req, res) => {
    try {
        const query = req.query.query;
        const hospital = await hospitalModel.searchHospitals(query);
        if (!hospital) {
            return res.json(null);
        }
        res.json(hospital);
    } catch (error) {
        console.error('Error searching hospitals:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// 병원 별 코멘트 가져오기
exports.getCommentByHospital = async (req, res) => {
    try {
        const query = req.query.query;
        const reviews = await ReviewModel.getReviewsByHospital(query);
        res.json(reviews);
    } catch (error) {
        console.error('Error fetching hospital comments:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.renderRegisterPage = (req, res) => {
    console.log('Rendering register page with Naver Map Client ID:', process.env.NAVER_MAP_CLIENT_ID);
    if (!process.env.NAVER_MAP_CLIENT_ID) {
        console.error('NAVER_MAP_CLIENT_ID is not set in environment variables');
    }
    const hospitalName = req.query.hospitalName || '';
    res.render('hospital/register', {
        naverMapClientId: process.env.NAVER_MAP_CLIENT_ID || '',
        hospitalName: hospitalName
    });
};

//리뷰 제출
exports.submitReview = async (req, res) => {
    try {
        const { hospital_id, patient_id, content } = req.body;
        const reviewId = await ReviewModel.createReview({ hospital_id, patient_id, content });
        const newReview = await ReviewModel.getReviewsByHospitalId(hospital_id);
        res.status(201).json(newReview);
    } catch (error) {
        console.error('Error submitting review:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
//console.log('Exporting controller functions:', Object.keys(exports));