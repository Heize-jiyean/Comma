const fs = require('fs').promises;
const path = require('path');

const paths = [
    path.join(__dirname, 'data', '../../python/vector/articleVectors.json'),
    path.join(__dirname, 'data', '../../python/vector/patientVectors.json'),
    path.join(__dirname, 'data', '../../python/vector/diaryVectors.json')
  ];

const readJson = async (idx) => {
    try {
        const data = await fs.readFile(paths[idx], 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        }
        console.error('파일 읽기 오류:', error);
        throw error;
    }
};

const writeJson = async (idx, data) => {
    try {
        await fs.writeFile(paths[idx], JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
        console.error('파일 쓰기 오류:', error);
        throw error;
    }
};

exports.addJson = async (idx, id, vectorResult) => {
    try {
        const data = await readJson(idx);
        const newEntry = { id: id, vector: vectorResult };
        data.push(newEntry);
        await writeJson(idx, data);
    } catch (error) {
        console.error('파일 추가 오류:', error);
        throw error;
    }
};

exports.getJson = async (idx, id) => {
    try {
        const data = await readJson(idx);
        const article = data.find(item => item.id === id);
        if (article) {
            res.json(article);
        } else {
            res.status(404).send('데이터를 찾을 수 없습니다.');
        }
    } catch (error) {
        console.error('파일 가져오기 오류:', error);
        throw error;
    }
};

exports.updateJson = async (idx, id, vectorResult) => {
    try {
        const data = await readJson(idx);
        const index = data.findIndex(item => item.id === id);
        if (index !== -1) {
            data[index] = { id: id, vector: vectorResult };
            await writeJson(idx, data);
        } else {
            res.status(404).send('데이터를 찾을 수 없습니다.');
        }
    } catch (error) {
        console.error('파일 업데이트 오류:', error);
        throw error;
    }
};

exports.deleteJson = async (idx, id) => {
    try {
        const data = await readJson(idx);
        const newData = data.filter(item => item.id !== id);
        if (data.length === newData.length) {
            res.status(404).send('데이터를 찾을 수 없습니다.');
        } else {
            await writeJson(idx, newData);
        }
    } catch (error) {
        console.error('파일 삭제 오류:', error);
        throw error;
    }
};