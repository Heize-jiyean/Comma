const profileModel = require('../models/User');

// 환자 프로필 페이지 반환
exports.patientProfilePage = (req, res) => {
    res.render("profile/patient.ejs", { user: req.user || null });
}

// 상담사 프로필 페이지 반환
exports.counselorProfilePage = (req, res) => {
    res.render("profile/counselor.ejs", { user: req.user || null });
}

