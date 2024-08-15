const DiaryModel = require('../models/Diary');
const axios = require('axios');

// 여러날자의 일기의 감정을 분류
exports.calculateEmotionPercentages = (Data) => {
    const total = { joy: 0, surprise: 0, anger: 0, anxiety: 0, hurt: 0, sadness: 0 };
    Data.forEach(entry => {
        total.joy += parseFloat(entry.joy);
        total.surprise += parseFloat(entry.surprise);
        total.anger += parseFloat(entry.anger);
        total.anxiety += parseFloat(entry.anxiety);
        total.hurt += parseFloat(entry.hurt);
        total.sadness += parseFloat(entry.sadness);
    });

    const totalSum = total.joy + total.surprise + total.anger + total.anxiety + total.hurt + total.sadness;
    const totalPercentages = {
        joy: totalSum > 0 ? (total.joy / totalSum) * 100 : 0,
        surprise: totalSum > 0 ? (total.surprise / totalSum) * 100 : 0,
        anger: totalSum > 0 ? (total.anger / totalSum) * 100 : 0,
        anxiety: totalSum > 0 ? (total.anxiety / totalSum) * 100 : 0,
        hurt: totalSum > 0 ? (total.hurt / totalSum) * 100 : 0,
        sadness: totalSum > 0 ? (total.sadness / totalSum) * 100 : 0
    };
    return totalPercentages;
}

// 차트 설명글을 위한 함수
exports.generateEmotionSummary = (percentageData) => {
    const emotionInfo = {
        joy: { color: '#FFAFCC', label: '기쁨' },
        surprise: { color: '#E9DF00', label: '당황' },
        anger: { color: '#FF4A4A', label: '분노' },
        anxiety: { color: '#FF9B52', label: '불안' },
        hurt: { color: '#62CC79', label: '상처' },
        sadness: { color: '#8588D5', label: '슬픔' }
    };

    // 감정 데이터 정렬 및 추출
    const sortedEmotions = Object.keys(percentageData)
    .map(key => ({
        emotion: key,
        percentage: Math.round(percentageData[key]), // 퍼센트를 정수로 변환
        color: emotionInfo[key].color,
        label: emotionInfo[key].label
    }))
    .sort((a, b) => b.percentage - a.percentage);

    // 상위 3개, 하위 1개 추출
    const topThreeEmotions = sortedEmotions.slice(0, 3);
    const leastEmotion = sortedEmotions[sortedEmotions.length - 1];

    // 클라이언트에 전송할 데이터 구성
    const descriptionEmotions = {
        topThree: topThreeEmotions,
        least: leastEmotion
    };

    return descriptionEmotions;
}

// 가입일~현재까지의 감정 추출, 분류
exports.calculateMonthlyEmotionPercentages = async (patientUser) => {
    const allPercentages = {};
    //const startDate = new Date(patientUser.registration_time); 
    const startDate = new Date(new Date().getFullYear(), new Date().getMonth() -3, 1); // 4개월 전부터
    const endDate = new Date();

    let currentDate = new Date(startDate);
    while(currentDate <= endDate) {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;

        const monthlyData = await DiaryModel.getEmotionDataByMonth(patientUser.patient_id, year, month);
        const monthlyPercentages = exports.calculateEmotionPercentages(monthlyData); // recentData->monthlyData
        allPercentages[`${year}-${month}`] = monthlyPercentages;

        currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return allPercentages;
}

// 감정 분석
exports.analyzeAndNotify = async (content, title, diaryId) => {
    try {
        content = content + title;
        const response = await axios.post('http://localhost:8000/classification', { sentence: content });
        const emotionResult = response.data;
        DiaryModel.registerEmotion(diaryId, emotionResult);
    } catch (e) {
        console.error("Emotion analysis error", e);
    }
}