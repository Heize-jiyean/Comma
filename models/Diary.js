exports.register = async (diary) => {
    try {
        const db = await require('../main').connection(); 

        let sql = `
            INSERT INTO diary (patient_id, title, content, image_url, is_visible) 
            VALUES (?, ?, ?, ?, ?)`;
        const [result] = await db.query(sql, [
            diary.patient_id,
            diary.title,
            diary.content,
            diary.image_url,
            diary.is_visible,
            // diary.joy,
            // diary.surprise,
            // diary.anger,
            // diary.anxiety,
            // diary.hurt,
            // diary.sadness
        ]);

        if (db && db.end) db.end()
        return result.insertId;

    } catch (error) {
        console.error("Diary.resgister() 쿼리 실행 중 오류:", error);
    }
};

exports.delete = async (diaryId) => {
    try {
        const db = await require('../main').connection(); 

        let sql = `
            DELETE FROM diary
            WHERE diary_id = ?`;
        await db.query(sql, [diaryId]);
        
        if (db && db.end) db.end()
        return diaryId;

    } catch (error) {
        console.error("Diary.delete() 쿼리 실행 중 오류:", error);
    }
};

exports.findImageUrlById = async (diaryId) => {
    try {
        const db = await require('../main').connection(); 

        let sql = `
            SELECT image_url 
            FROM diary
            WHERE diary_id = ?`; 
        const [rows, fields] = await db.query(sql, [diaryId]);
        
        if (db && db.end) db.end()
        return rows.length > 0 ? rows[0].image_url : null;

    } catch (error) {
        console.error("Diary.findImageUrlById() 쿼리 실행 중 오류:", error);
    }
};

exports.findById = async (diaryId) => {
    try {
        const db = await require('../main').connection(); 

        let sql = `
            SELECT * 
            FROM diary
            WHERE diary_id = ?`; 
        const [rows, fields] = await db.query(sql, [diaryId]);
        
        if (db && db.end) db.end()
        return rows.length > 0 ? rows[0] : null;

    } catch (error) {
        console.error("Diary.findImageUrlById() 쿼리 실행 중 오류:", error);
    }
};

exports.toggleVisibility = async (diaryId) => {
    try {
        const db = await require('../main').connection(); 

        let sql = `
            UPDATE diary
            SET is_visible = NOT is_visible
            WHERE diary_id = ?;`; 
        const [rows, fields] = await db.query(sql, [diaryId]);
        
        if (db && db.end) db.end()
        return;

    } catch (error) {
        console.error("Diary.findImageUrlById() 쿼리 실행 중 오류:", error);
    }
};