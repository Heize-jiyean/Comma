// 관심 상담사로 등록 (환자 -> 상담사)
exports.addScrapCounselor = async(patientId, counselorId) => {
    try {
        const db = await require('../main').connection();

        let sql = `
            INSERT INTO scrap (patient_id, counselor_id, type) 
            VALUES (?, ?, 'patient_to_counselor')`;

        const [result] = await db.query(sql, [patientId, counselorId]);

        if (db && db.end) { db.end().catch(err => { console.error('DB 연결 종료 중 오류:', err); }); }

        return result.affectedRows === 1;
    } catch (error) {
        console.error("ScrapModel.addScrapCounselor 오류: ", error);
        throw error;
    }
}

// 관심 환자로 등록 (상담사 -> 환자)
exports.addScrapPatient = async(patientId, counselorId) => {
    try {
        const db = await require('../main').connection();

        let sql = `
            INSERT INTO scrap (patient_id, counselor_id, type) 
            VALUES (?, ?, 'counselor_to_patient')`;

        const [result] = await db.query(sql, [patientId, counselorId]);
        
        if (db && db.end) { db.end().catch(err => { console.error('DB 연결 종료 중 오류:', err); }); }

        return result.affectedRows === 1;
    } catch (error) {
        console.error("ScrapModel.addScrapPatient 오류: ", error);
        throw error;
    }
}

// 관심 상담사인지 확인 (환자 -> 상담사)
exports.checkPatientScrapCounselor = async(patientId, counselorId) => {
    try {
        const db = await require('../main').connection();

        const sql = `
            SELECT COUNT(*) AS count
            FROM scrap
            WHERE patient_id = ? AND counselor_id = ? AND type = 'patient_to_counselor'`;

        const [result] = await db.query(sql, [patientId, counselorId]);

        if (db && db.end) { db.end().catch(err => { console.error('DB 연결 종료 중 오류:', err); }); }

        return result[0].count > 0;
    } catch (error) {
        console.error("ScrapModel.checkPatientScrapCounselor 오류: ", error);
        throw error;
    }
}


// 관심 환자인지 확인 (상담사 -> 환자)
exports.checkCounselorScrapPatient = async(patientId, counselorId) => {
    try {
        const db = await require('../main').connection();

        const sql = `
            SELECT COUNT(*) AS count
            FROM scrap
            WHERE patient_id = ? AND counselor_id = ? AND type = 'counselor_to_patient'`;

        const [result] = await db.query(sql, [patientId, counselorId]);

        if (db && db.end) { db.end().catch(err => { console.error('DB 연결 종료 중 오류:', err); }); }

        return result[0].count > 0;
    } catch (error) {
        console.error("ScrapModel.checkCounselorScrapPatient 오류: ", error);
        throw error;
    }
}

// 관심 환자 해제
exports.removeScrapPatient = async(patientId, counselorId) => {
    try {
        const db = await require('../main').connection();

        const sql = `
            DELETE FROM scrap
            WHERE patient_id = ? AND counselor_id = ? AND type = 'counselor_to_patient'
        `;

        const [result] = await db.query(sql, [patientId, counselorId]);

        if (db && db.end) { db.end().catch(err => { console.error('DB 연결 종료 중 오류:', err); }); }

        return result.affectedRows === 1;
    } catch (error) {
        console.error("ScrapModel.removeScrapPatient 오류: ", error);
        throw error;
    }
}


// 관심 상담사 해제
exports.removeScrapCounselor = async(patientId, counselorId) => {
    try {
        const db = await require('../main').connection();

        const sql = `
            DELETE FROM scrap
            WHERE patient_id = ? AND counselor_id = ? AND type = 'patient_to_counselor'
        `;

        const [result] = await db.query(sql, [patientId, counselorId]);

        if (db && db.end) { db.end().catch(err => { console.error('DB 연결 종료 중 오류:', err); }); }

        return result.affectedRows === 1;
    } catch (error) {
        console.error("ScrapModel.removeScrapCounselor 오류: ", error);
        throw error;
    }
}

// 환자가 스크랩한 상담사 목록 불러오기
exports.getScrappedCounselorsByPatientId = async(patientId) => {
    try {
        const db = await require('../main').connection();

        const sql = `
            SELECT counselor_id
            FROM scrap
            WHERE patient_id = ? AND type = 'patient_to_counselor';
        `;

        const [rows] = await db.query(sql, [patientId]);

        if (db && db.end) { db.end().catch(err => { console.error('DB 연결 종료 중 오류:', err); }); }

        return rows;

    } catch (error) {
        console.error("ScrapModel.getScrappedCounselorsByPatientId 오류: ", error);
        throw error;
    }
}

// 환자를 스크랩한 상담사 목록 불러오기
exports.getScrappingCounselorsByPatientId = async(patientId) => {
    try {
        const db = await require('../main').connection();

        const sql = `
            SELECT counselor_id
            FROM scrap
            WHERE patient_id = ? AND type = 'counselor_to_patient';
        `;

        const [rows] = await db.query(sql, [patientId]);

        if (db && db.end) { db.end().catch(err => { console.error('DB 연결 종료 중 오류:', err); }); }

        return rows;
    } catch (error) {
        console.error("ScrapModel.getScrappingCounselorsByPatientId 오류: ", error);
        throw error;
    }
}

// 상담사가 스크랩한 환자 목록 불러오기
exports.getScrappedPatientsByCounselorId = async(counselorId) => {
    try {
        const db = await require('../main').connection();

        const sql = `
            SELECT patient_id
            FROM scrap
            WHERE counselor_id = ? AND type = 'counselor_to_patient';
        `;

        const [rows] = await db.query(sql, [counselorId]);

        if (db && db.end) { db.end().catch(err => { console.error('DB 연결 종료 중 오류:', err); }); }

        return rows;
        
    } catch (error) {
        console.error("ScrapModel.getScrappedPatientsByCounselorId 오류: ", error);
        throw error;
    }
}

// 상담사를 스크랩한 환자 목록 불러오기
exports.getScrappingPatientsByCounselorId = async(counselorId) => {
    try {
        const db = await require('../main').connection();

        const sql = `
            SELECT patient_id
            FROM scrap
            WHERE counselor_id = ? AND type = 'patient_to_counselor';
        `;

        const [rows] = await db.query(sql, [counselorId]);

        if (db && db.end) { db.end().catch(err => { console.error('DB 연결 종료 중 오류:', err); }); }

        return rows;

    } catch (error) {
        console.error("ScrapModel.getScrappingPatientsByCounselorId 오류: ", error);

    }
}