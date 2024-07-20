const ReviewModel = require('../models/Review');
const hospitalModel = require('../models/Hospital');

// 병원 메인 페이지 로딩
exports.loadingMainPage = async (req, res) => {
    
    const reviews = await ReviewModel.getLatestReviews();
    const hospitals = await hospitalModel.getAllHospitals();
    res.locals.reviews = reviews;
    res.locals.hospitals = hospitals;
    res.render('hospital/hospital');
}

// 병원 위치 로딩
exports.getHospitalLocation = async (req, res) => {
    const query = req.query.query;
    
    const hospital = await hospitalModel.searchHospitals(query);
    if (!hospital) {
        res.json("null")
    }
    res.json(hospital);
}

exports.renderRegisterPage = (req, res) => {
    if (!process.env.NAVER_MAP_CLIENT_ID) {
        console.error('NAVER_MAP_CLIENT_ID is not set in environment variables');
    }
    res.render('hospital/register', {
        naverMapClientId: process.env.NAVER_MAP_CLIENT_ID || ''
    });
};