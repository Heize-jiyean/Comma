const bcrypt = require('bcrypt');

// 환자 정보 생성
exports.createPatient = async (user) => {
    try {
        const db = await require('../main').connection();
        let sql = `
            INSERT INTO patient (email, password, nickname, id, age, gender, job) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`;
        const [result] = await db.query(sql, [
            user.email,
            user.password,
            user.nickname,
            user.id,
            user.age,
            user.gender,
            user.job,
        ]);

        if (db && db.end) { db.end().catch(err => { console.error('DB 연결 종료 중 오류:', err); }); }
        return result.insertId;
    } catch (error) {
        console.error("UserModel.createUser() 쿼리 실행 중 오류:", error);
        throw error;
    }
};

// 의사 정보 생성
exports.createCounselor = async (user) => {
    try {
        const db = await require('../main').connection();
        let sql = `
            INSERT INTO counselor (email, password, nickname, id, age, gender, specialty, experience) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        const [result] = await db.query(sql, [
            user.email,
            user.password,
            user.nickname,
            user.id,
            user.age,
            user.gender,
            user.specialty,
            user.experience,
        ]);

        if (db && db.end) { db.end().catch(err => { console.error('DB 연결 종료 중 오류:', err); }); }
        return result.insertId;
    } catch (error) {
        console.error("UserModel.createUser() 쿼리 실행 중 오류:", error);
        throw error;
    }
};

// 환자정보 아이디로 가져오기
exports.getPatientByPatientId = async (patientId) => {
    try {
        const db = await require('../main').connection();
        let sql = `
            SELECT *
            FROM patient
            WHERE patient_id = ?`;

        const [rows, fields] = await db.query(sql, [patientId]);

        if (db && db.end) { db.end().catch(err => { console.error('DB 연결 종료 중 오류:', err); }); }

        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
        console.error("UserModel.getPatientByPatientId() 쿼리 실행 중 오류:", error);
        throw error;
    }
};

// 환자 정보 이메일로 가져오기
exports.getPatientByEmail = async (email) => {
    try {
        const db = await require('../main').connection();
        let sql = `
            SELECT *
            FROM patient
            WHERE email = ?`;

        const [result] = await db.query(sql, [email]);

        if (db && db.end) { db.end().catch(err => { console.error('DB 연결 종료 중 오류:', err); }); }

        return result.length > 0 ? result[0] : null;
    } catch (error) {
        console.error("UserModel.createUser() 쿼리 실행 중 오류:", error);
        throw error;
    }
};

// 의사 정보 이메일로 가져오기
exports.getCounselorByEmail = async (email) => {
    try {
        const db = await require('../main').connection();
        let sql = `
            SELECT *
            FROM counselor
            WHERE email = ?`;

        const [result] = await db.query(sql, [email]);

        if (db && db.end) { db.end().catch(err => { console.error('DB 연결 종료 중 오류:', err); }); }

        return result.length > 0 ? result[0] : null;
    } catch (error) {
        console.error("UserModel.createUser() 쿼리 실행 중 오류:", error);
        throw error;
    }
};

// 환자 정보 로그인아이디로 가져오기
exports.getPatientByUserId = async (id) => {
    try {
        const db = await require('../main').connection();
        let sql = `
            SELECT *
            FROM patient
            WHERE id = ?`;
        const [result] = await db.query(sql, [id]);

        if (db && db.end) { db.end().catch(err => { console.error('DB 연결 종료 중 오류:', err); }); }

        return result.length > 0 ? result[0] : null;
    } catch (error) {
        console.error('UserModel.getPatientByUserId 오류:', error);
        throw error;
    }
};

// 의사 정보 로그인아이디로 가져오기
exports.getCounselorByUserId = async (id) => {
    try {
        const db = await require('../main').connection();
        let sql = `
            SELECT *
            FROM counselor
            WHERE id = ?`;
        const [result] = await db.query(sql, [id]);

        if (db && db.end) { db.end().catch(err => { console.error('DB 연결 종료 중 오류:', err); }); }

        return result.length > 0 ? result[0] : null;
    } catch (error) {
        console.error('UserModel.getCounselorByUserId 오류:', error);
        throw error;
    }
};

// 의사 정보 의사아이디로 가져오기
exports.getCounselorByCounselorId = async (counselorId) => {
    try {
        const db = await require('../main').connection();
        let sql = `
            SELECT *
            FROM counselor
            WHERE counselor_id = ?`;

        const [result] = await db.query(sql, [counselorId]);

        if (db && db.end) { db.end().catch(err => { console.error('DB 연결 종료 중 오류:', err); }); }

        return result.length > 0 ? result[0] : null;
    } catch (error) {
        console.error('UserModel.getCounselorByCounselorId 오류:', error);
        throw error;
    }
};


// 비밀번호 검증
exports.verifyPassword = async (plainPassword, hashedPassword) => {
    return await bcrypt.compare(plainPassword, hashedPassword);
};

// 환자 로그인
exports.loginPatient = async (email, password) => {
    try {
        const patient = await exports.getPatientByEmail(email);
        if (patient && await exports.verifyPassword(password, patient.password)) {
            return patient;
        }
        return null;
    } catch (error) {
        console.error("Patient login error:", error);
        throw error;
    }
};

// 의사 로그인
exports.loginCounselor = async (email, password) => {
    try {
        const counselor = await exports.getCounselorByEmail(email);
        if (counselor && await exports.verifyPassword(password, counselor.password)) {
            return counselor;
        }
        return null;
    } catch (error) {
        console.error("Counselor login error:", error);
        throw error;
    }
};

// 환자 프로필 업데이트
exports.updatePatientProfile = async (patientId, profileData) => {
    try {
        const db = await require('../main').connection();

        let sql = `
            UPDATE patient
            SET nickname = ?,
                age = ?,
                gender = ?,
                bio = ?,
                job = ?
            WHERE patient_id = ?`;

        const [result] = await db.query(sql, [
            profileData.nickname,
            profileData.age,
            profileData.gender,
            profileData.bio,
            profileData.job,
            patientId
        ]);

        if (db && db.end) { db.end().catch(err => { console.error('DB 연결 종료 중 오류:', err); }); }

        return;

    } catch (error) {
        console.error('UserModel.updatePatientProfile 오류:', error);
        throw error;
    }
}

// 상담사 프로필 업데이트
exports.updateCounselorProfile = async (counselorId, profileData) => {
    try {
        const db = await require('../main').connection();

        let sql = `
            UPDATE counselor
            SET nickname = ?,
                age = ?,
                gender = ?,
                bio = ?,
                specialty = ?,
                experience = ?
            WHERE counselor_id = ?`;

        const [result] = await db.query(sql, [
            profileData.nickname,
            profileData.age,
            profileData.gender,
            profileData.bio,
            profileData.specialty,
            profileData.experience,
            counselorId
        ]);

        if (db && db.end) { db.end().catch(err => { console.error('DB 연결 종료 중 오류:', err); }); }

        return;

    } catch (error) {
        console.error('UserModel.updateCounselorProfile 오류:', error);
        throw error;
    }
}

// 환자 비밀번호 확인 
exports.checkPatientPassword = async (patientId, inputPassword) => {
    try {
        const db = await require('../main').connection();
        let sql = `
            SELECT password
            FROM patient
            WHERE patient_id = ?`;

        const [result] = await db.query(sql, [patientId]);
        const passwordMatch = await bcrypt.compare(inputPassword, result[0].password);

        if (db && db.end) { db.end().catch(err => { console.error('DB 연결 종료 중 오류:', err); }); }

        return passwordMatch;

    } catch (error) {
        console.log('UserModel.checkPatientPassword 오류:', error);
        throw error;
    }
}

// 상담사 비밀번호 확인
exports.checkCounselorPassword = async (counselorId, inputPassword) => {
    try {
        const db = await require('../main').connection();
        let sql = `
            SELECT password
            FROM counselor
            WHERE counselor_id = ?`;

        const [result] = await db.query(sql, [counselorId]);
        const passwordMatch = await bcrypt.compare(inputPassword, result[0].password);

        if (db && db.end) { db.end().catch(err => { console.error('DB 연결 종료 중 오류:', err); }); }

        return passwordMatch;

    } catch (error) {
        console.log('UserModel.checkCounselorPassword 오류:', error);
        throw error;
    }
}

// 환자 비밀번호 변경
exports.updatePatientPassword = async(patientId, newPassword) => {
    try {
        const db = await require('../main').connection();
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        let sql = `
            UPDATE patient
            SET password = ?
            WHERE patient_id = ?`;

        const [result] = await db.query(sql, [hashedPassword, patientId]);

        if (db && db.end) { db.end().catch(err => { console.error('DB 연결 종료 중 오류:', err); }); }

        return result.affectedRows === 1;

    } catch (error) {
        console.log('UserModel.updatePatientPassword 오류:', error);
        throw error;
    }
}

// 상담사 비밀번호 변경
exports.updateCounselorPassword = async(counselorId, newPassword) => {
    try {
        const db = await require('../main').connection();
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        let sql = `
            UPDATE counselor
            SET password = ?
            WHERE counselor_id = ?`;

        const [result] = await db.query(sql, [hashedPassword, counselorId]);

        if (db && db.end) { db.end().catch(err => { console.error('DB 연결 종료 중 오류:', err); }); }

        return result.affectedRows === 1;

    } catch (error) {
        console.log('UserModel.updateCounselorPassword 오류:', error);
        throw error;
    }
}


// 환자 계정 탈퇴
exports.removePatient = async (patientId) => {
    try {
        const db = await require('../main').connection();
        let sql = `
            DELETE FROM patient
            WHERE patient_id = ?`;

        const [result] = await db.query(sql, [patientId]);

        if (db && db.end) { db.end().catch(err => { console.error('DB 연결 종료 중 오류:', err); }); }

        return (result.affectedRows === 1);

    } catch (error) {
        console.log('UserModel.removePatient 오류:', error);
        throw error;
    }
}

// 상담사 계정 탈퇴
exports.removeCounselor = async (counselorId) => {
    try {
        const db = await require('../main').connection();
        let sql = `
            DELETE FROM counselor
            WHERE counselor_id = ?`;

        const [result] = await db.query(sql, [counselorId]);

        if (db && db.end) { db.end().catch(err => { console.error('DB 연결 종료 중 오류:', err); }); }

        return (result.affectedRows === 1);

    } catch (error) {
        console.log('UserModel.removeCounselor 오류:', error);
        throw error;
    }
}