// 환자 정보 생성
exports.createPatient = async (user) => {
    try {
        const db = await require('../main').connection();
        let sql = `
            INSERT INTO patient (email, password, nickname, name, age, gender, job) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`;
        const [result] = await db.query(sql, [
            user.email,
            user.password,
            user.nickname,
            user.name,
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
            INSERT INTO counselor (email, password, nickname, name, age, gender, specialty) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`;
        const [result] = await db.query(sql, [
            user.email,
            user.password,
            user.nickname,
            user.name,
            user.age,
            user.gender,
            user.specialty,
        ]);

        if (db && db.end) { db.end().catch(err => { console.error('DB 연결 종료 중 오류:', err); }); }
        return result.insertId;
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
        console.error('UserModel.getPatientByNickname 오류:', error);
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
        console.error('UserModel.getCounselorByNickname 오류:', error);
        throw error;
    }
};