// 병원 전체 정보 가져오는 함수
exports.getAllHospitals = async () => {
    const db = await require('../main').connection();
    const sql = `
        SELECT *
        FROM hospital`;
    const [rows] = await db.query(sql);
    if (db && db.end) { db.end().catch(err => { console.error('DB 연결 종료 중 오류:', err); }); }
    return rows;
}

// 병원 검색 함수
exports.searchHospitals = async (query) => {
    const db = await require('../main').connection();
    const sql = `
        SELECT *
        FROM hospital
        WHERE name LIKE ? OR address LIKE ?`;

    const [rows] = await db.query(sql, [`%${query}%`, `%${query}%`]);
    if (db && db.end) { db.end().catch(err => { console.error('DB 연결 종료 중 오류:', err); }); }
    return rows;
}