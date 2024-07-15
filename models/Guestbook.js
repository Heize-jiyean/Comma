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