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
exports.getPatientById = async (patientId) => {
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
        console.error("UserModel.createUser() 쿼리 실행 중 오류:", error);
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

exports.saveResetToken = async (userId, token, expires) => {
    try {
        const db = await require('../main').connection();
        console.log('Attempting to save reset token for userId:', userId);
        let sql = `
            UPDATE patient
            SET reset_token = ?, reset_token_expires = ?
            WHERE id = ?`;
        let [result] = await db.query(sql, [token, new Date(expires), userId]);
        console.log('Patient update result:', result);

        // 환자 테이블에서 업데이트가 되지 않았다면 의사 테이블에서 시도
        if (result.affectedRows === 0) {
            console.log('No patient found, trying counselor table');
            sql = `
                UPDATE counselor
                SET reset_token = ?, reset_token_expires = ?
                WHERE id = ?`;
            [result] = await db.query(sql, [token, new Date(expires), userId]);
            console.log('Counselor update result:', result);
        }

        if (db && db.end) { db.end().catch(err => { console.error('DB 연결 종료 중 오류:', err); }); }
        
        const success = result.affectedRows > 0;
        console.log('saveResetToken success:', success);
        return success;
    } catch (error) {
        console.error("saveResetToken 오류:", error);
        throw error;
    }
};

// 재설정 토큰으로 사용자 조회
exports.getUserByResetToken = async (token) => {
    try {
        const db = await require('../main').connection();
        let sql = `
            SELECT * FROM patient
            WHERE reset_token = ? AND reset_token_expires > NOW()`;
        let [result] = await db.query(sql, [token]);

        if (result.length === 0) {
            // 환자 테이블에 없다면 의사 테이블에서 조회
            sql = `
                SELECT * FROM counselor
                WHERE reset_token = ? AND reset_token_expires > NOW()`;
            [result] = await db.query(sql, [token]);
        }

        if (db && db.end) { db.end().catch(err => { console.error('DB 연결 종료 중 오류:', err); }); }

        return result.length > 0 ? result[0] : null;
    } catch (error) {
        console.error("getUserByResetToken 오류:", error);
        throw error;
    }
};

// 비밀번호 업데이트
exports.updatePassword = async (userId, hashedPassword) => {
    try {
        const db = await require('../main').connection();
        let sql = `
            UPDATE patient
            SET password = ?
            WHERE id = ?`;
        let [result] = await db.query(sql, [hashedPassword, userId]);

        // 환자 테이블에서 업데이트가 되지 않았다면 의사 테이블에서 시도
        if (result.affectedRows === 0) {
            sql = `
                UPDATE counselor
                SET password = ?
                WHERE id = ?`;
            [result] = await db.query(sql, [hashedPassword, userId]);
        }

        if (db && db.end) { db.end().catch(err => { console.error('DB 연결 종료 중 오류:', err); }); }
        
        return result.affectedRows > 0;
    } catch (error) {
        console.error("updatePassword 오류:", error);
        throw error;
    }
};

// 재설정 토큰 제거
exports.clearResetToken = async (userId) => {
    try {
        const db = await require('../main').connection();
        let sql = `
            UPDATE patient
            SET reset_token = NULL, reset_token_expires = NULL
            WHERE id = ?`;
        let [result] = await db.query(sql, [userId]);

        // 환자 테이블에서 업데이트가 되지 않았다면 의사 테이블에서 시도
        if (result.affectedRows === 0) {
            sql = `
                UPDATE counselor
                SET reset_token = NULL, reset_token_expires = NULL
                WHERE id = ?`;
            [result] = await db.query(sql, [userId]);
        }

        if (db && db.end) { db.end().catch(err => { console.error('DB 연결 종료 중 오류:', err); }); }
        
        return result.affectedRows > 0;
    } catch (error) {
        console.error("clearResetToken 오류:", error);
        throw error;
    }
};

// 환자 정보 닉네임으로 가져오기
exports.getPatientByNickname = async (nickname) => {
    try {
        const db = await require('../main').connection();
        let sql = `
            SELECT *
            FROM patient
            WHERE nickname = ?`;

        const [result] = await db.query(sql, [nickname]);

        if (db && db.end) { db.end().catch(err => { console.error('DB 연결 종료 중 오류:', err); }); }

        return result.length > 0 ? result[0] : null;
    } catch (error) {
        console.error("UserModel.getPatientByNickname 오류:", error);
        throw error;
    }
};

// 의사 정보 닉네임으로 가져오기
exports.getCounselorByNickname = async (nickname) => {
    try {
        const db = await require('../main').connection();
        let sql = `
            SELECT *
            FROM counselor
            WHERE nickname = ?`;

        const [result] = await db.query(sql, [nickname]);

        if (db && db.end) { db.end().catch(err => { console.error('DB 연결 종료 중 오류:', err); }); }

        return result.length > 0 ? result[0] : null;
    } catch (error) {
        console.error("UserModel.getCounselorByNickname 오류:", error);
        throw error;
    }
};