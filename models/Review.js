// 모든 리뷰 최신순으로 불러오기
exports.getLatestReviews = async () => {
    try {
        const db = await require('../main').connection();
        const [rows] = await db.query(`
            SELECT r.review_id, r.content, r.created_at, 
                   h.name AS hospital_name, h.address AS hospital_address, 
                   p.nickname AS patient_nickname
            FROM review r
            JOIN hospital h ON r.hospital_id = h.hospital_id
            JOIN patient p ON r.patient_id = p.patient_id
            ORDER BY r.created_at DESC
        `);

        // 날짜 형식 변환
        rows.forEach(row => {
            row.created_at = new Date(row.created_at).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric'
            });
        });
        if (db && db.end) { db.end().catch(err => { console.error('DB 연결 종료 중 오류:', err); }); }
        return rows;
    } catch (err) {
        throw new Error('Error fetching reviews: ' + err.message);
    }
};

// 병원 별 리뷰 최신순으로 불러오기
exports.getReviewsByHospital = async (hospitalId) => {
    try {
        const db = await require('../main').connection();
        const [rows] = await db.query(`
            SELECT r.review_id, r.content, r.created_at, 
                   h.name AS hospital_name, h.address AS hospital_address, 
                   p.nickname AS patient_nickname, p.patient_id
            FROM review r
            JOIN hospital h ON r.hospital_id = h.hospital_id
            JOIN patient p ON r.patient_id = p.patient_id
            WHERE h.hospital_id = ?
            ORDER BY r.created_at DESC
        `, [hospitalId]);

        // 날짜 형식 변환
        rows.forEach(row => {
            row.created_at = new Date(row.created_at).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric'
            });
        });
        if (db && db.end) { db.end().catch(err => { console.error('DB 연결 종료 중 오류:', err); }); }
        return rows;
    } catch (err) {
        throw new Error('Error fetching reviews for hospital: ' + err.message);
    }
};

// 병원 ID로 리뷰 가져오는 함수 (새로 추가)
exports.getReviewsByHospitalId = async (hospitalId) => {
    try {
        const db = await require('../main').connection();
        const [rows] = await db.query(`
            SELECT r.review_id, r.content, r.created_at, 
                   h.name AS hospital_name, h.address AS hospital_address, 
                   p.nickname AS patient_nickname
            FROM review r
            JOIN hospital h ON r.hospital_id = h.hospital_id
            JOIN patient p ON r.patient_id = p.patient_id
            WHERE h.hospital_id = ?
            ORDER BY r.created_at DESC
        `, [hospitalId]);

        // 날짜 형식 변환
        rows.forEach(row => {
            row.created_at = new Date(row.created_at).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric'
            });
        });
        if (db && db.end) { db.end().catch(err => { console.error('DB 연결 종료 중 오류:', err); }); }
        return rows;
    } catch (err) {
        throw new Error('Error fetching reviews by hospital ID: ' + err.message);
    }
};

// 리뷰 등록 함수
exports.createReview = async (reviewData) => {
    try {
        const db = await require('../main').connection();
        const [result] = await db.query(`
            INSERT INTO review (hospital_id, patient_id, content, created_at)
            VALUES (?, ?, ?, NOW())
        `, [reviewData.hospital_id, reviewData.patient_id, reviewData.content]);

        if (db && db.end) { db.end().catch(err => { console.error('DB 연결 종료 중 오류:', err); }); }
        return result.insertId;
    } catch (err) {
        throw new Error('Error creating review: ' + err.message);
    }
};

// 리뷰 삭제 함수
exports.deleteReview = async (reviewId) => {
    try {
        const db = await require('../main').connection();
        await db.query(`
            DELETE FROM review 
            WHERE review_id = ?
        `, [reviewId]);

        if (db && db.end) {
            db.end().catch(err => {
                console.error('DB 연결 종료 중 오류:', err);
            });
        }

        return reviewId;
    } catch (err) {
        throw new Error('Error deleting review: ' + err.message);
    }
}