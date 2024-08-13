const ReviewModel = require('../models/Review');
const hospitalModel = require('../models/Hospital');

// 병원 메인 페이지 로딩
exports.loadingMainPage = async (req, res) => {
    try {
        const reviews = await ReviewModel.getLatestReviews();
        const hospitals = await hospitalModel.getAllHospitals();
        console.log('Session user:', req.session.user);
        res.render('hospital/hospital', { 
            reviews: reviews,
            hospitals: hospitals,
            naverMapClientId: process.env.NAVER_MAP_CLIENT_ID || '',
            hospitalName: '',
            patientId: req.session.user ? req.session.user.id : null  // patient_id 대신 id 사용
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

// 검색어 자동 완성
exports.getAutoComplete = async (req, res) => {
    const query = req.query.query;
    if (query) {
        const suggestions = await hospitalModel.getAutocomplete(query);
        res.json({ suggestions });
    }
}

// 병원 별 코멘트 가져오기
exports.getCommentByHospital = async (req, res) => {
    try {
        const query = req.query.query;
        const currentUserId = req.session.user.id;
        const reviews = await ReviewModel.getReviewsByHospital(query);
        res.json({ reviews, currentUserId });
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
        if (!req.session.user || !req.session.user.id) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const { hospital_id, content } = req.body;
        const patient_id = req.session.user.id;  // patient_id 대신 id 사용

        const reviewId = await ReviewModel.createReview({ hospital_id, patient_id, content });
        const newReview = await ReviewModel.getReviewsByHospitalId(hospital_id);
        res.status(201).json(newReview);
    } catch (error) {
        console.error('Error submitting review:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

//리뷰 삭제
exports.deleteReview = async (req, res) => {
    try {
        if (!req.session.user || !req.session.user.id) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const reviewId = req.params.reviewId;
        await ReviewModel.deleteReview(reviewId);
        res.status(200).json({ message: "리뷰가 성공적으로 삭제되었습니다." });

    } catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// 새로운 함수 추가
exports.checkLoginAndLoadPage = (req, res) => {
    if (req.session.user && req.session.user.id) {
        // 사용자가 로그인한 경우, 기존의 loadingMainPage 함수 로직을 실행
        this.loadingMainPage(req, res);
    } else {
        // 사용자가 로그인하지 않은 경우
        res.render('login/login-required');
    }
};