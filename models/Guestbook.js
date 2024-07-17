// 방명록 등록
exports.register = async (guestbook) => {
    try {
        const db = await require('../main').connection(); 

        let sql = `
            INSERT INTO guestbook (patient_id, counselor_id, title, content) 
            VALUES (?, ?, ?, ?)`;
        const [result] = await db.query(sql, [
            guestbook.patient_id,
            guestbook.counselor_id,
            guestbook.title,
            guestbook.content,
        ]);

        if (db && db.end) db.end()
        return result.insertId;

    } catch (error) {
        console.error("Guestbook.resgister() 쿼리 실행 중 오류:", error);
    }
}

// 환자 아이디로 한자에게 작성된 방명록 찾기
exports.findAllByPatientId = async (patientId) => {
    try {
        const db = await require('../main').connection();

        let sql = `
        SELECT *
        FROM guestbook
        WHERE patient_id =?
        ORDER BY created_at DESC`;

        const [rows, fields] = await db.query(sql, [patientId]);

        if (db && db.end) { db.end().catch(err => { console.error('DB 연결 종료 중 오류:', err); }); }

        return rows;
     } catch (error) {
        console.log("Guestbook.findAllByPatientId() 쿼리 실행 중 오류: ", error);
    }
}

// 환자 아이디로 한자에게 작성된 방명록 찾기 (페이지네이션)
exports.findAllByPatientIdWithPagination = async (patientId, page, limit) => {
    try {
        const db = await require('../main').connection();

        const offset = limit * (page - 1);

        let sql = `
            SELECT *
            FROM guestbook
            WHERE patient_id = ?
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?`;  // LIMIT은 한 번에 가져올 최대 행, OFFSET은 몇 개의 행을 건너뛸지

        const [rows, fields] = await db.query(sql, [patientId, limit, offset]);

        if (db && db.end) { db.end().catch(err => { console.error('DB 연결 종료 중 오류:', err); }); }

        return rows;
    } catch (error) {
        console.log("Guestbook.findAllByPatientIdWithPagination() 쿼리 실행 중 오류: ", error)
    }
}

// 환자의 아이디로 환자에게 작성된 최신 4개의 방명록 찾기
exports.findLatestFourByPatientId = async (patientId) => {
    try {
        const db = await require("../main").connection();

        let sql = `
        SELECT *
        FROM guestbook
        WHERE patient_id = ?
        ORDER BY created_at DESC
        LIMIT 4`;

        const [rows, fields] = await db.query(sql, [patientId]);

        if (db && db.end) { db.end().catch(err => { console.error('DB 연결 종료 중 오류:', err); }); }

        return rows;

    } catch (error) {
        console.log("Guestbook.findLatestByPatientId() 쿼리 실행 중 오류: ", error);
    }
}

// 환자 아이디로 환자에게 작성됨 방명록의 총 개수 구하기
exports.countByPatientId = async (patientId) => {
    try {
        const db = await require("../main").connection();

        let sql = `
            SELECT COUNT(*) AS total
            FROM guestbook
            WHERE patient_id = ?`;

        const [rows, fields] = await db.query(sql, [patientId]);

        if (db && db.end) { db.end().catch(err => { console.error('DB 연결 종료 중 오류:', err); }); }

        return rows[0].total;
    } catch (error) {
        console.log("Guestbook.countByPatientId() 쿼리 실행 중 오류: ", error);
    }
}

// 상담사 아이디로 상담사가 작성한 방명록 찾기
exports.findAllByCounselorId = async (counselorId) => {
    try {
        const db = await require('../main').connection();

        let sql = `
        SELECT *
        FROM guestbook
        WHERE counselor_id = ?
        ORDER BY created_at DESC`;

        const [rows, fields] = await db.query(sql, [counselorId]);

        if (db && db.end) { db.end().catch(err => { console.error('DB 연결 종료 중 오류:', err); }); }

        return rows;
    } catch (error) {
        console.log("Guestbook.findAllByCounselorId() 쿼리 실행 중 오류: ", error);
    }
    
}

// 상담사 아이디로 상담사가 작성한 방명록 찾기 (페이지네이션)
exports.findAllByCounselorIdWithPagination = async(counselorId, page, limit) => {
    try {
        const db = await require('../main').connection();

        const offset = limit * (page - 1);

        let sql = `
            SELECT *
            FROM guestbook
            WHERE counselor_id = ?
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?`;  // LIMIT은 한 번에 가져올 최대 행, OFFSET은 몇 개의 행을 건너뛸지

        const [rows, fields] = await db.query(sql, [counselorId, limit, offset]);

        if (db && db.end) { db.end().catch(err => { console.error('DB 연결 종료 중 오류:', err); }); }

        return rows;
    } catch (error) {
        console.log("Guestbook.findAllByPatientIdWithPagination() 쿼리 실행 중 오류: ", error)
    }
}