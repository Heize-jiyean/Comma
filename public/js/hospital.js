// 네이버 지도 초기화 (실제 좌표로 대체 필요)
const map = new naver.maps.Map('map', {
    center: new naver.maps.LatLng(37.5665, 126.9780),
    zoom: 15
});

const hospitalsData = document.getElementById('hospitalsData').value;
const hospitals = JSON.parse(hospitalsData);

hospitals.forEach(hospital => {
    const position = new naver.maps.LatLng(hospital.latitude, hospital.longitude);
    console.log(hospital);
    // 기본 제공 마커 생성
    const marker = new naver.maps.Marker({
        position: position,
        map: map,
        title: hospital.name // 마커에 툴팁 텍스트 추가
    });

    // 인포윈도우에 병원 이름 추가
    const contentString = `<div style="padding: 5px; font-size: 12px; font-weight: bold;">${hospital.name}</div>`;
    const infowindow = new naver.maps.InfoWindow({
        content: contentStDring,
        backgroundColor: 'white',
        borderColor: '#D6D7DA',
        anchorSize: new naver.maps.Size(10, 10)
    });

    // 마커 클릭 시 인포윈도우 열기
    naver.maps.Event.addListener(marker, 'click', () => {
        // 클릭한 마커의 인포윈도우 열기
        infowindow.open(map, marker);
        // 코멘트 가져오기
        collectCommentHospital(hospital.hospital_id)
    });
});

// 검색 시 병원 정보 가져오기
document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form[role="search"]');
    const hospitalInfoDiv = document.getElementById('hospitalInfo');

    form.addEventListener('submit', async (event) => {
        event.preventDefault(); // 페이지 새로고침 방지

        const searchQuery = form.querySelector('input[name="search"]').value;

        try {
            const response = await fetch(`/hospital/search?query=${encodeURIComponent(searchQuery)}`);

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            updateMapLocation(data);
            updateHospitalInfo(data[0]);
        } catch (error) {
            console.error('Error:', error);
        }
    });

    function updateMapLocation(data) {
        // 데이터에 위치 정보가 포함되어 있다고 가정
        if (data[0] && data[0].latitude && data[0].longitude) {
            const map = new naver.maps.Map('map', {
                center: new naver.maps.LatLng(data[0].latitude, data[0].longitude),
                zoom: 17
            });

            // 인포윈도우에 병원 이름 추가
            const contentString = `<div style="padding: 5px; font-size: 12px; font-weight: bold;">${data[0].name}</div>`;
            const infowindow = new naver.maps.InfoWindow({
                content: contentString,
                backgroundColor: 'white',
                borderColor: '#D6D7DA',
                anchorSize: new naver.maps.Size(10, 10)
            });

            const marker = new naver.maps.Marker({
                position: new naver.maps.LatLng(data[0].latitude, data[0].longitude),
                map: map
            });

            // 마커와 인포윈도우가 항상 보이도록 설정
            infowindow.open(map, marker);
            // 코멘트 가져오기
            collectCommentHospital(data[0].hospital_id)

        } else {
            console.log('No location data available');
        }
    }

    function updateHospitalInfo(hospital) {
        hospitalInfoDiv.innerHTML = `
            <h3>${hospital.name}</h3>
            <p>주소: ${hospital.address}</p>
            <p>전화번호: ${hospital.phone || '정보 없음'}</p>
            <p>카테고리: ${hospital.category || '정보 없음'}</p>
        `;
    }
});

// 병원 코멘트 가져오기
async function collectCommentHospital(hospital_id) {
    try {
        const response = await fetch(`/hospital/comment?query=${encodeURIComponent(hospital_id)}`);

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const reviews = await response.json();
        updateReviewList(reviews);
    } catch (error) {
        console.error('Error:', error);
    }
}

// 리뷰 목록을 업데이트하는 함수
function updateReviewList(reviews) {
    const commentList = document.querySelector('.comment-list');
    commentList.innerHTML = ''; // 기존 내용을 비웁니다.

    if (reviews.length > 0) {
        reviews.forEach(review => {
            const comment = document.createElement('div');
            comment.className = 'comment';

            comment.innerHTML = `
        <div class="hospital">
            <h4>${review.hospital_name}</h4>
            <p>${review.hospital_address}</p>
        </div>
        <div class="profile">
            <div class="photo-container">
                <img src="https://www.studiopeople.kr/common/img/default_profile.png" alt="프로필 이미지" class="photo">
                <span>${review.patient_nickname}</span>
            </div>
            <span>${review.created_at}</span>
        </div>
        <div class="review">
            <p>${review.content}</p>
        </div>
    `;
            commentList.appendChild(comment);
        });
    } else {
        commentList.innerHTML = '<p>리뷰가 없습니다.</p>';
    }
}