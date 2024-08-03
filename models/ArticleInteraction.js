
// 좋아요 검색
exports.findLikeByPatientAndArticle = async (articleId, patientId) => {
    try {
        const db = await require('../main').connection(); 

        let sql = 'select * from article_like where article_id = ? and patient_id = ?;';
        let [rows] = await db.query(sql, [articleId, patientId]); 

        if (db && db.end) db.end();
        return rows.length > 0 ? rows[0] : null;

    } catch (error) {
        console.error("ArticleInteraction.findLikeByPatientAndArticle() 쿼리 실행 중 오류:", error);
    }
};

// 좋아요 등록 
exports.createLike = async (articleId, patientId) => {
    try {
        const db = await require('../main').connection(); 

        let sql = `INSERT INTO article_like (article_id, patient_id) VALUES (?, ?);`;
        await db.query(sql, [articleId, patientId]); 

        if (db && db.end) db.end();
        return;

    } catch (error) {
        console.error("ArticleInteraction.createLike() 쿼리 실행 중 오류:", error);
    }
};

// 좋아요 삭제
exports.deleteLike = async (articleId, patientId) => {
    try {
        const db = await require('../main').connection(); 

        let sql = `DELETE FROM article_like WHERE article_id = ? AND patient_id = ?`;
        await db.query(sql, [articleId, patientId]);

        if (db && db.end) db.end();
        return;

    } catch (error) {
        console.error("ArticleInteraction.deleteLike() 쿼리 실행 중 오류:", error);
    }
}
// 특정 멤버의 좋아요 전체 조회





// 북마크 검색
exports.findBookmarkByPatientAndArticle = async (articleId, patientId) => {
    try {
        const db = await require('../main').connection(); 

        let sql = 'select * from article_bookmark where article_id = ? and patient_id = ?;';
        let [rows] = await db.query(sql, [articleId, patientId]); 

        if (db && db.end) db.end();
        return rows.length > 0 ? rows[0] : null;

    } catch (error) {
        console.error("ArticleInteraction.findBookmarkByPatientAndArticle() 쿼리 실행 중 오류:", error);
    }
};

// 북마크 등록 
exports.createBookmark = async (articleId, patientId) => {
    try {
        const db = await require('../main').connection(); 

        let sql = `INSERT INTO article_bookmark (article_id, patient_id) VALUES (?, ?);`;
        await db.query(sql, [articleId, patientId]); 

        if (db && db.end) db.end();
        return;

    } catch (error) {
        console.error("ArticleInteraction.createBookmark() 쿼리 실행 중 오류:", error);
    }
};

// 북마크 삭제
exports.deleteBookmark = async (articleId, patientId) => {
    try {
        const db = await require('../main').connection(); 

        let sql = `DELETE FROM article_bookmark WHERE article_id = ? AND patient_id = ?`;
        await db.query(sql, [articleId, patientId]);

        if (db && db.end) db.end();
        return;

    } catch (error) {
        console.error("ArticleInteraction.deleteBookmark() 쿼리 실행 중 오류:", error);
    }
}

// 특정 멤버의 북마크 전체 조회

