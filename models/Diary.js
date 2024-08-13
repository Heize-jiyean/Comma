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
        ]);

        if (db && db.end) db.end();
        return result.insertId;

    } catch (error) {
        console.error("Diary.resgister() 쿼리 실행 중 오류:", error);
    }
};

exports.registerEmotion = async (diaryID, emotions) => {
    try {
        const db = await require('../main').connection(); 

        let sql = `
            UPDATE diary
            SET joy = ?, surprise = ?, anger = ?, anxiety = ?, hurt = ?, sadness = ?
            WHERE diary_id = ?;
            `;
        const [result] = await db.query(sql, [
            emotions.기쁨,
            emotions.당황,
            emotions.분노,
            emotions.불안,
            emotions.상처,
            emotions.슬픔,
            diaryID
        ]);

        if (db && db.end) db.end();
        return;

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

exports.findBypatientIdAndDate = async (patientId, year, month, day) => {
    try {
        const db = await require('../main').connection(); 

        let sql = `
            SELECT *
            FROM diary
            WHERE patient_id = ?
                AND YEAR(created_at) = ?
                AND MONTH(created_at) = ?
                AND DAY(created_at) = ?
            `; 
        const [rows, fields] = await db.query(sql, [patientId, parseInt(year), parseInt(month), parseInt(day)]);
        
        if (db && db.end) db.end();
        return rows.length > 0 ? rows[0] : null;

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

// 상담사 메인화면용
exports.PreviewfindAll = async (page, option, counselorId) => {
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
            WHERE 
                d.is_visible = TRUE
            `;
        switch(option) {
            case('all'): break;
            case('commented'):
                sql += `
                    AND
                    p.patient_id IN ( 
                        SELECT patient_id
                        FROM guestbook
                        WHERE counselor_id = ?
                    )
                `;
                break;
            case('scrapted'):
                sql += `
                    AND
                    p.patient_id IN ( 
                        SELECT patient_id
                        FROM scrap
                        WHERE counselor_id = ?
                    )
                `;
                break;
        }
        sql += `ORDER BY d.created_at DESC LIMIT ? OFFSET ?;`

        let rows, fields;
        if (option == 'all') { [rows, fields] = await db.query(sql, [pageSize, offset]); }
        else { [rows, fields] = await db.query(sql, [counselorId, pageSize, offset]); }

        if (db && db.end) db.end();
        return rows.length > 0 ? rows : null;

    } catch (error) {
        console.error("Diary.findImageUrlById() 쿼리 실행 중 오류:", error);
    }
};
exports.countOfFindAll = async (option, counselorId) => {
    try {
        const db = await require('../main').connection(); 

        let sql = `
            SELECT 
                COUNT(*) AS total
            FROM 
                diary d 
            JOIN 
                patient p ON d.patient_id = p.patient_id
            WHERE 
                d.is_visible = TRUE
            `;
        switch(option) {
            case('all'): break;
            case('commented'):
                sql += `
                    AND
                    p.patient_id IN ( 
                        SELECT patient_id
                        FROM guestbook
                        WHERE counselor_id = ?
                    )
                `;
                break;
            case('scrapted'):
                sql += `
                    AND
                    p.patient_id IN ( 
                        SELECT patient_id
                        FROM scrap
                        WHERE counselor_id = ?
                    )
                `;
                break;
        }

        const [rows, fields] = await db.query(sql, [counselorId]);
        
        if (db && db.end) db.end();
        return rows[0].total;

    } catch (error) {
        console.error("Diary.countOfFindAll() 쿼리 실행 중 오류:", error);
    }
};


// 환자 프로필 용
exports.PreviewfindByPatientId = async (page, patientId, role, pageSize) => {
    try {
        const db = await require('../main').connection(); 

        let offset = pageSize * (page - 1);
        let sql;

        if (role == "patient") {
            sql = `
                SELECT 
                    d.*,
                    p.nickname,
                    p.profile_picture
                FROM 
                    diary d 
                JOIN 
                    patient p ON d.patient_id = p.patient_id
                WHERE 
                    d.patient_id = ?
                ORDER BY d.created_at DESC LIMIT ? OFFSET ?;
            `;
        }
        else if (role == "counselor") {
            sql = `
                SELECT 
                    d.*,
                    p.nickname,
                    p.profile_picture
                FROM 
                    diary d 
                JOIN 
                    patient p ON d.patient_id = p.patient_id
                WHERE 
                    d.patient_id = ? 
                    AND d.is_visible = TRUE
                ORDER BY d.created_at DESC LIMIT ? OFFSET ?;
            `;
        }
        
        const [rows, fields] = await db.query(sql, [patientId, pageSize, offset]);

        if (db && db.end) db.end();
        return rows.length > 0 ? rows : null;

    } catch (error) {
        console.error("Diary.PreviewfindByPatientId() 쿼리 실행 중 오류:", error);
    }
};
exports.countOfFindByPatientId = async (patientId, role) => {
    try {
        const db = await require('../main').connection(); 
        let sql; 

        if (role == "patient") {
            sql = `
                SELECT 
                    COUNT(*) AS total
                FROM 
                    diary d 
                WHERE 
                    patient_id = ?;
            `;
        }
        else if (role == "counselor") {
            sql = `
                SELECT 
                    COUNT(*) AS total
                FROM 
                    diary d 
                WHERE 
                    patient_id = ?
                    AND d.is_visible = TRUE;
            `;
        }
        
        const [rows, fields] = await db.query(sql, [patientId]);

        if (db && db.end) db.end();
        return rows[0].total;

    } catch (error) {
        console.error("Diary.PreviewfindByPatientId() 쿼리 실행 중 오류:", error);
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
        console.error("Diary.findAllByPatientId() 쿼리 실행 중 오류: ", error)
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
        console.error("Diary.findLatestByPatientId() 쿼리 실행 중 오류: ", error);
    }
}

//감정 모델
//최근 30일 감정 불러오기 
exports.getEmotionData = async (patientId) => {
    try {
        const db = await require('../main').connection();

        let sql = `
            SELECT created_at, joy, surprise, anger, anxiety, hurt, sadness 
            FROM diary 
            WHERE 
                patient_id = ?
                AND created_at >= CURDATE() - INTERVAL 30 DAY
            ORDER BY created_at ASC`;
        const [rows] = await db.query(sql, [patientId]);

        if (db && db.end) db.end();
        return rows;

    } catch (error) {
        console.error("getEmotionData 쿼리 실행 중 오류:", error);
        return [];
    }
};

//최근 해당 달의 감정 불러오기
exports.getEmotionDataByMonth  = async (patientId, year, month) => {
    try {
        const db = await require('../main').connection();

        let sql = `
            SELECT created_at, joy, surprise, anger, anxiety, hurt, sadness 
            FROM diary 
            WHERE 
                patient_id = ?
                AND YEAR(created_at) = ?
                AND MONTH(created_at) = ?
            ORDER BY created_at ASC`;
        const [rows] = await db.query(sql, [patientId, parseInt(year), parseInt(month)]);

        if (db && db.end) db.end();
        return rows;

    } catch (error) {
        console.error("getEmotionDataByMonth 쿼리 실행 중 오류:", error);
        return [];
    }
};

exports.findByPatientId = async (patientId) => {
    try {
        const db = await require('../main').connection(); 

        let sql = `
            SELECT diary_id
            FROM diary
            WHERE patient_id = ?`;
        
        const [rows] = await db.query(sql, [patientId]);

        if (db && db.end) db.end();

        const diaryIds = rows.map(row => row.diary_id);
        return diaryIds.length > 0 ? diaryIds : [];

    } catch (error) {
        console.error("Article.findByPatientId() 쿼리 실행 중 오류:", error);
    }
};