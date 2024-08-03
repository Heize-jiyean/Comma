// 댓글관련 함수
exports.createCounselorComment = async (commentData) => {
    try {
        const db = await require('../main').connection();
        let sql = `INSERT INTO comment_counselor (guestbook_id, counselor_id, content, created_at) VALUES (?, ?, ?, ?)`;
        const [result] = await db.query(sql, [commentData.guestbook_id, commentData.author_id, commentData.content, commentData.created_at]);
        if (db && db.end) db.end();
        return result.insertId;
    } catch (error) {
        console.error("Comment.createCounselorComment() 오류:", error);
        return null;
    }
};

exports.createPatientComment = async (commentData) => {
    try {
        const db = await require('../main').connection();
        let sql = `INSERT INTO comment_patient (guestbook_id, patient_id, content, created_at) VALUES (?, ?, ?, ?)`;
        const [result] = await db.query(sql, [commentData.guestbook_id, commentData.author_id, commentData.content, commentData.created_at]);
        if (db && db.end) db.end();
        return result.insertId;
    } catch (error) {
        console.error("Comment.createPatientComment() 오류:", error);
        return null;
    }
};


exports.findCommentsByGuestbookId = async (guestbookId) => {
    try {
        const db = await require('../main').connection();
        let sql = `
            SELECT 'Counselor' as author_type, counselor_id as author_id, content, created_at
            FROM comment_counselor
            WHERE guestbook_id = ?
            UNION ALL
            SELECT 'Patient', patient_id, content, created_at
            FROM comment_patient
            WHERE guestbook_id = ?
            ORDER BY created_at DESC
        `;
        const [rows] = await db.query(sql, [guestbookId, guestbookId]);
        if (db && db.end) db.end();
        return rows;
    } catch (error) {
        console.error("Comment.findCommentsByGuestbookId() 오류:", error);
        return [];
    }
};
