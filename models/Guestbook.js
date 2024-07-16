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

// 환자 아이디로 방명록 찾기
exports.findAllByPatientId = async (patientId) => {
    try {
        const db = await require('../main').connection();

        let sql = `
        SELECT *
        FROM guestbook
        WHERE patient_id =?`;

        const [rows, fields] = await db.query(sql, [patientId]);

        if (db && db.end) { db.end().catch(err => { console.error('DB 연결 종료 중 오류:', err); }); }

        return rows;
     } catch (error) {
        console.log("Guestbook.findAllByPatientId() 쿼리 실행 중 오류: ", error);
    }
}

// 상담사 아이디로 방명록 찾기
exports.findAllByCounselorId = async (counselorId) => {
    try {
        const db = await require('../main').connection();

        let sql = `
        SELECT *
        FROM guestbook
        WHERE counselor_id = ?`;

        const [rows, fields] = await db.query(sql, [counselorId]);

        if (db && db.end) { db.end().catch(err => { console.error('DB 연결 종료 중 오류:', err); }); }

        return rows;
    } catch (error) {
        console.log("Guestbook.findAllByCounselorId() 쿼리 실행 중 오류: ", error);
    }
    
}
