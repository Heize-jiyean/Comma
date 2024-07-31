
exports.register = async (article) => {
    try {
        const db = await require('../main').connection(); 

        let sql = `
            INSERT INTO article (counselor_id, title, content) 
            VALUES (?, ?, ?)`;
        const [result] = await db.query(sql, [
            article.counselor_id,
            article.title,
            article.content
        ]);

        if (db && db.end) db.end();
        return result.insertId;

    } catch (error) {
        console.error("Article.resgister() 쿼리 실행 중 오류:", error);
    }
};

exports.findById = async (articleId) => {
    try {
        const db = await require('../main').connection(); 

        let sql = `
            SELECT * 
            FROM article
            WHERE article_id = ?`; 
        const [rows, fields] = await db.query(sql, [articleId]);
        
        if (db && db.end) db.end();
        return rows.length > 0 ? rows[0] : null;

    } catch (error) {
        console.error("Article.findById() 쿼리 실행 중 오류:", error);
    }
};

// 조회수 증가 
exports.increasedViews = async (articleId) => {
    try {
        const db = await require('../main').connection(); 

        let sql = 'UPDATE article SET views = views + 1 WHERE article_id = ?';
        await db.query(sql, [articleId]);

        if (db && db.end) db.end();
        return;

    } catch (error) {
        console.error("Article.increasedViews() 쿼리 실행 중 오류:", error);
    }
};

