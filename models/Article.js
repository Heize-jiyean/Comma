
exports.register = async (article) => {
    try {
        const db = await require('../main').connection(); 

        let sql = `
            INSERT INTO article (counselor_id, title, content, thumbnail_url) 
            VALUES (?, ?, ?, ?)`;
        const [result] = await db.query(sql, [
            article.counselor_id,
            article.title,
            article.content,
            article.thumbnail_url
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

exports.PreviewFindAll = async (page, sortBy) => {
    try {
        const db = await require('../main').connection();        

        const pageSize = 9;
        let offset = pageSize * (page - 1);

        let sql = `
            SELECT 
                a.*,
                c.nickname,
                c.profile_picture,
                (SELECT COUNT(*) FROM article_like WHERE article_like.article_id = a.article_id) AS like_count,
                (SELECT COUNT(*) FROM article_bookmark WHERE article_bookmark.article_id = a.article_id) AS bookmark_count
            FROM 
                article a 
            JOIN 
                counselor c ON a.counselor_id = c.counselor_id `;      

        switch (sortBy) {
            case 'views':
                sql += `ORDER BY a.views DESC`;
                break;
            case 'likes':
                sql += `ORDER BY like_count DESC`;
                break;
            case 'bookmarks':
                sql += `ORDER BY bookmark_count DESC`;
                break;
            default:
                sql += `ORDER BY a.created_at DESC`;
                break;
        }    
        sql += ` LIMIT ? OFFSET ?`;
        const [rows] = await db.query(sql, [pageSize, offset]);

        if (db && db.end) db.end();
        return rows.length > 0 ? rows : null;

    } catch (error) {
        console.error("Post.findByQueryAndSortBy() 쿼리 실행 중 오류:", error);
    }
}
exports.countOfFindAll = async (sortBy) => {
    try {
        const db = await require('../main').connection();        
        let sql = `
            SELECT 
                COUNT(*) AS total
            FROM 
                article a `;      
        switch (sortBy) {
            case 'views':
                sql += `ORDER BY a.views DESC`;
                break;
            case 'likes':
                sql += `ORDER BY (SELECT COUNT(*) FROM article_like WHERE article_like.article_id = a.article_id) DESC`;
                break;
            case 'bookmarks':
                sql += `ORDER BY (SELECT COUNT(*) FROM article_bookmark WHERE article_bookmark.article_id = a.article_id) DESC`;
                break;
            default:
                sql += `ORDER BY a.created_at DESC`;
                break;
        }    
        const [rows] = await db.query(sql);

        if (db && db.end) db.end();
        return rows[0].total;

    } catch (error) {
        console.error("Post.findByQueryAndSortBy() 쿼리 실행 중 오류:", error);
    }
}

//프로필에 사용
exports.findLatestFourByCounselorId = async (counselorId) => {
    try {
        const db = await require('../main').connection(); 

        let sql = `
            SELECT * 
            FROM article
            WHERE counselor_id = ?
            ORDER BY created_at DESC
            LIMIT 4`; // 최신 4개의 아티클만 가져옵니다.
        
        const [rows] = await db.query(sql, [counselorId]);

        if (db && db.end) db.end();
        return rows;

    } catch (error) {
        console.error("Article.findLatestFourByCounselorId() 쿼리 실행 중 오류:", error);
    }
};

exports.delete = async (articleId) => {
    try {
        const db = await require('../main').connection(); 

        let sql = `
            DELETE FROM article
            WHERE article_id = ?`;
        await db.query(sql, [articleId]);
        
        if (db && db.end) db.end();
        return articleId;

    } catch (error) {
        console.error("Diary.delete() 쿼리 실행 중 오류:", error);
    }
};

exports.RecommendTop3 = async (aid) => {
    try {
        const db = await require('../main').connection();        
        let results = [];

        for (const id of aid) {
            const sql = `
                SELECT 
                    a.*,
                    c.nickname,
                    c.profile_picture
                FROM 
                    article a 
                JOIN 
                    counselor c ON a.counselor_id = c.counselor_id
                WHERE
                    a.article_id = ?
                ;`;

            let [rows] = await db.query(sql, [id]);
            results.push(...rows);
        }

        if (db && db.end) db.end();
        return results.length > 0 ? results : null;
      
    } catch (error) {
        console.error("Post.findByQueryAndSortBy() 쿼리 실행 중 오류:", error);
    }
}