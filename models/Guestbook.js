//방명록 등록
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

        if (db && db.end) db.end();
        return result.insertId;

    } catch (error) {
        console.error("Guestbook.register() 쿼리 실행 중 오류:", error);
    }
}

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


//작성자ID
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
