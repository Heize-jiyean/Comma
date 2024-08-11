//방명록 등록
// models/Guestbook.js

exports.register = async (guestbook) => {
    try {
        const db = await require('../main').connection();

        // KST 시간 생성
        const now = new Date();
        const offset = 9 * 60 * 60 * 1000; // 9시간 (한국 시간대)
        const kstTime = new Date(now.getTime() + offset);
        const createdAtKST = kstTime.toISOString().slice(0, 19).replace('T', ' ');

        let sql = `
            INSERT INTO guestbook (patient_id, counselor_id, title, content, created_at) 
            VALUES (?, ?, ?, ?, ?)`;
        const [result] = await db.query(sql, [
            guestbook.patient_id,
            guestbook.counselor_id,
            guestbook.title,
            guestbook.content,
            createdAtKST
        ]);

        if (db && db.end) db.end();
        return result.insertId;

    } catch (error) {
        console.error("Guestbook.register() 쿼리 실행 중 오류:", error);
    }
};



//방명록 상세조회
exports.findById = async (guestbookId) => {
    try {
        const db = await require('../main').connection(); 

        let sql = `
            SELECT * 
            FROM guestbook
            WHERE guestbook_id = ?`; 
        const [rows, fields] = await db.query(sql, [guestbookId]);
        
        if (db && db.end) db.end();
        return rows.length > 0 ? rows[0] : null;

    } catch (error) {
        console.error("Guestbook.findById() 쿼리 실행 중 오류:", error);
    }
}


//방명록 작성자ID 구하기
exports.getCounselorID = async (counselorId) => {
    try {
        const db = await require('../main').connection(); 

        let sql = `
            SELECT * 
            FROM counselor
            WHERE counselor_id = ?`;
        const [rows, fields] = await db.query(sql, [counselorId]);

        if (db && db.end) db.end();
        return rows.length > 0 ? rows[0] : null;

    } catch (error) {
        console.error("Guestbook.getCounselorID() 쿼리 실행 중 오류:", error);
    }
};

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

//방명록을 받은 환자id 구하기
exports.getPatientIdByGuestbookId = async (guestbookId) => {
    try {
        const db = await require('../main').connection(); 
        let sql = `
            SELECT patient.id
            FROM patient
            JOIN guestbook ON patient.patient_id = guestbook.patient_id
            WHERE guestbook.guestbook_id = ?;

        `;
        const [rows] = await db.query(sql, [guestbookId]);

        if (db && db.end) db.end();
        return rows.length > 0 ? rows[0].id : null;  // 환자의 id 반환

    } catch (error) {
        console.error("getPatientIdByGuestbookId() 쿼리 실행 중 오류:", error);
        if (db && db.end) db.end();
        return null;  // 오류 발생 시 null 반환
    }
};


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

// 환자 아이디로 환자에게 작성된 방명록의 총 개수 구하기
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

// 상담사 아이디로 상담사가 작성한 방명록의 총 개수 구하기
exports.countByCounselorId = async (counselorId) => {
    try {
        const db = await require("../main").connection();

        let sql = `
            SELECT COUNT(*) AS total
            FROM guestbook
            WHERE counselor_id = ?`;

        const [rows, fields] = await db.query(sql, [counselorId]);

        if (db && db.end) { db.end().catch(err => { console.error('DB 연결 종료 중 오류:', err); }); }

        return rows[0].total;
    } catch (error) {
        console.log("Guestbook.countByCounselorId() 쿼리 실행 중 오류: ", error);
    }
}

// 방명록 수정,업데이트
exports.update = async (guestbookId, guestbookData) => {
    try {
        const db = await require('../main').connection();
        let sql = `UPDATE guestbook SET title = ?, content = ? WHERE guestbook_id = ?`;

        const [result] = await db.query(sql, [guestbookData.title, guestbookData.content, guestbookId]);

        if (db && db.end) db.end();
        return result.affectedRows;
    } catch (error) {
        console.error("Guestbook.update() 쿼리 실행 중 오류:", error);
        if (db && db.end) db.end();
        return null;
    }
};


// 방명록 삭제 처리함수
exports.delete = async (guestbookId) => {
    try {
        const db = await require('../main').connection();
        let sql = `DELETE FROM guestbook WHERE guestbook_id = ?`;
        const [result] = await db.query(sql, [guestbookId]);

        if (db && db.end) db.end();
        return result.affectedRows; // 삭제된 행의 수를 반환
    } catch (error) {
        console.error("Guestbook.delete() 쿼리 실행 중 오류:", error);
    }
};


// 방명록 ID로 댓글 불러오는 함수
exports.getCommentsByGuestbookId = async (guestbookId) => {
    try {
        const db = await require('../main').connection(); 
        let sql = `
            SELECT 'counselor' as author_type, cc.comment_id, cc.content, cc.created_at, c.nickname as author_name, c.profile_picture as author_image
            FROM comment_counselor cc
            JOIN counselor c ON cc.counselor_id = c.counselor_id
            WHERE cc.guestbook_id = ?
            UNION ALL
            SELECT 'patient' as author_type, cp.comment_id, cp.content, cp.created_at, p.nickname as author_name, p.profile_picture as author_image
            FROM comment_patient cp
            JOIN patient p ON cp.patient_id = p.patient_id
            WHERE cp.guestbook_id = ?
            ORDER BY created_at DESC
        `;
        const [rows] = await db.query(sql, [guestbookId, guestbookId]);

        if (db && db.end) db.end();
        return rows;
    } catch (error) {
        console.error("getCommentsByGuestbookId() 쿼리 실행 중 오류:", error);
        if (db && db.end) db.end();
        return null;
    }
};

//프로필에 사용
exports.findLatestFourByCounselorId = async (counselorId) => {
    try {
        const db = await require('../main').connection(); 

        let sql = `
            SELECT * 
            FROM guestbook
            WHERE counselor_id = ?
            ORDER BY created_at DESC
            LIMIT 4`; // 최신 4개의 방명록만 가져옵니다.
        
        const [rows] = await db.query(sql, [counselorId]);

        if (db && db.end) db.end();
        return rows;

    } catch (error) {
        console.error("Guestbook.findLatestFourByCounselorId() 쿼리 실행 중 오류:", error);
    }
};


