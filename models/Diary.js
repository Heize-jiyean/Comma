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

        if (db && db.end) db.end();
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
        
        if (db && db.end) db.end();
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
        
        if (db && db.end) db.end();
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
        
        if (db && db.end) db.end();
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
        
        if (db && db.end) db.end();
        return;

    } catch (error) {
        console.error("Diary.findImageUrlById() 쿼리 실행 중 오류:", error);
    }
};

exports.findAll = async (page) => {
    try {
        const db = await require('../main').connection(); 

        const pageSize = 9;
        let offset = pageSize * (page - 1);

        let sql = `
            SELECT 
                d.*,
                p.nickname,
                p.profile_picture
            FROM 
                diary d 
            JOIN 
                patient p ON d.patient_id = p.patient_id
            ORDER BY d.created_at DESC LIMIT ? OFFSET ?
            `;

        const [rows, fields] = await db.query(sql, [pageSize, offset]);
        
        if (db && db.end) db.end();
        return rows.length > 0 ? rows : null;

    } catch (error) {
        console.error("Diary.findImageUrlById() 쿼리 실행 중 오류:", error);
    }
};

exports.countOfFindAll = async (page) => {
    try {
        const db = await require('../main').connection(); 

        let sql = `
            SELECT 
                COUNT(*) AS total
            FROM 
                diary d 
            `;

        const [rows, fields] = await db.query(sql);
        
        if (db && db.end) db.end();
        return rows[0].total;

    } catch (error) {
        console.error("Diary.countOfFindAll() 쿼리 실행 중 오류:", error);
    }
};
exports.findAllByPatientId = async(patientId) => {
    try {
        const db = await require('../main').connection();

        let sql = `
        SELECT *
        FROM diary
        WHERE patient_id = ?`;

        const [rows, fields] = await db.query(sql, [patientId]);

        if (db && db.end) { db.end().catch(err => { console.error('DB 연결 종료 중 오류:', err); }); }

        return rows;

    } catch (error) {
        console.log("Diary.findAllByPatientId() 쿼리 실행 중 오류: ", error)
    }
}

// 환자의 아이디로 환자가 작성한 최신 4개의 일기 가져오기
exports.findLatestFourByPatientId = async (patientId) => {
    try {
        const db = await require("../main").connection();

        let sql = `
        SELECT *
        FROM diary
        WHERE patient_id = ?
        ORDER BY created_at DESC
        LIMIT 4`;

        const [rows, fields] = await db.query(sql, [patientId]);

        if (db && db.end) { db.end().catch(err => { console.error('DB 연결 종료 중 오류:', err); }); }

        return rows;

    } catch (error) {
        console.log("Diary.findLatestByPatientId() 쿼리 실행 중 오류: ", error);
    }
}