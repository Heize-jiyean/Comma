
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

// 특정 멤버의 좋아요 전체 조회 (추천 시스템에서 사용)
exports.findLikeByPatient = async (patientId) => {
    try {
        const db = await require('../main').connection(); 

        let sql = `SELECT article_id FROM article_like WHERE patient_id = ?`;
        let [rows] = await db.query(sql, [patientId]); 

        if (db && db.end) db.end();
        
        const articleIds = rows.map(row => row.article_id);
        return articleIds.length > 0 ? articleIds : [];

    } catch (error) {
        console.error("ArticleInteraction.findLikeByPatient() 쿼리 실행 중 오류:", error);
    }
};

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

// 특정 멤버의 좋아요/북마크 전체 조회
exports.PreviewFindInteraction = async (patient_id, page, option) => {
    try {
        const db = await require('../main').connection();        

        const pageSize = 9;
        let offset = pageSize * (page - 1);

        let sql = `
            SELECT 
                a.*,
                c.nickname,
                c.profile_picture
            FROM 
                article a 
            JOIN 
                counselor c ON a.counselor_id = c.counselor_id `;      

        switch (option) {
            case 'like':
                sql += `
                JOIN 
                    article_like al ON a.article_id = al.article_id
                WHERE 
                    al.patient_id = ?`;
                break;
            case 'bookmark':
                sql += `
                JOIN 
                    article_bookmark ab ON a.article_id = ab.article_id
                WHERE 
                    ab.patient_id = ?`;
                break;
        }    
        sql += ` ORDER BY a.created_at DESC LIMIT ? OFFSET ?`;
        const [rows] = await db.query(sql, [parseInt(patient_id), pageSize, offset]);

        console.log(rows);

        if (db && db.end) db.end();
        return rows.length > 0 ? rows : null;

    } catch (error) {
        console.error("ArticleInteraction.PreviewFindInteraction() 쿼리 실행 중 오류:", error);
    }
}
exports.countOfFindInteraction = async (patient_id, option) => {
    try {
        const db = await require('../main').connection();        

        let sql = `
            SELECT 
                COUNT(*) AS total
            FROM 
                article a 
            `;      
        switch (option) {
            case 'like':
                sql += `
                JOIN 
                    article_like al ON a.article_id = al.article_id
                WHERE 
                    al.patient_id = ?`;
                break;
            case 'bookmark':
                sql += `
                JOIN 
                    article_bookmark ab ON a.article_id = ab.article_id
                WHERE 
                    ab.patient_id = ?`;
                break;
        }    
        const [rows] = await db.query(sql, [parseInt(patient_id)]);

        console.log(rows[0].total);

        if (db && db.end) db.end();
        return rows[0].total;

    } catch (error) {
        console.error("ArticleInteraction.countOfFindInteraction() 쿼리 실행 중 오류:", error);
    }
}
