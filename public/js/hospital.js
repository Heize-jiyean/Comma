// 네이버 지도 초기화 (실제 좌표로 대체 필요)
const map = new naver.maps.Map('map', {
    center: new naver.maps.LatLng(37.5665, 126.9780),
    zoom: 15
});

const hospitalsData = document.getElementById('hospitalsData').value;
const hospitals = JSON.parse(hospitalsData);

if (Array.isArray(hospitals)) {
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
            content: contentString,
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
}

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
            if (data && data.length > 0) {
                updateMapLocation(data[0]);
                updateHospitalInfo(data[0]);
                collectCommentHospital(data[0].hospital_id);
            } else {
                hospitalInfoDiv.innerHTML = '<p>검색 결과가 없습니다.</p>';
            }
        } catch (error) {
            console.error('Error:', error);
            hospitalInfoDiv.innerHTML = '<p>검색 중 오류가 발생했습니다.</p>';
        }
    });
});

function updateMapLocation(data) {
    // 데이터에 위치 정보가 포함되어 있다고 가정
    if (data.latitude && data.longitude) {
        const position = new naver.maps.LatLng(data.latitude, data.longitude);
        map.setCenter(position);
        map.setZoom(17);

        // 기존 마커 제거
        if (window.currentMarker) {
            window.currentMarker.setMap(null);
        }

        // 새 마커 생성
        window.currentMarker = new naver.maps.Marker({
            position: position,
            map: map
        });

        // 인포윈도우에 병원 이름 추가
        const contentString = `<div style="padding: 5px; font-size: 12px; font-weight: bold;">${data.name}</div>`;
        const infowindow = new naver.maps.InfoWindow({
            content: contentString,
            backgroundColor: 'white',
            borderColor: '#D6D7DA',
            anchorSize: new naver.maps.Size(10, 10)
        });

        // 마커와 인포윈도우가 항상 보이도록 설정
        infowindow.open(map, window.currentMarker);
    } else {
        console.log('No location data available');
    }
}

function updateHospitalInfo(hospital) {
    const hospitalInfoDiv = document.getElementById('hospitalInfo');
    hospitalInfoDiv.innerHTML = `
        <h3>${hospital.name}</h3>
        <p>주소: ${hospital.address || '정보 없음'}</p>
        <p>위도: ${hospital.latitude}</p>
        <p>경도: ${hospital.longitude}</p>
        <p>웹사이트: ${hospital.website ? `<a href="${hospital.website}" target="_blank">${hospital.website}</a>` : '정보 없음'}</p>
        <button onclick="writeReview('${hospital.name}')" class="btn btn-primary">리뷰 쓰기</button>
    `;
}

function writeReview(hospitalName) {
    window.location.href = `/hospital/register?hospitalName=${encodeURIComponent(hospitalName)}`;
}

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
            comment.className = 'comment card mb-3';

            comment.innerHTML = `
                <div class="card-body">
                    <div class="hospital">
                        <h4>${review.hospital_name}</h4>
                        <p>${review.hospital_address}</p>
                    </div>
                    <div class="profile d-flex justify-content-between align-items-center">
                        <div class="photo-container d-flex align-items-center">
                            <img src="https://www.studiopeople.kr/common/img/default_profile.png" alt="프로필 이미지" class="photo rounded-circle" width="30" height="30">
                            <span class="ms-2">${review.patient_nickname}</span>
                        </div>
                        <span>${review.created_at}</span>
                    </div>
                    <div class="review mt-2">
                        <p>${review.content}</p>
                    </div>
                </div>
            `;
            commentList.appendChild(comment);
        });
    } else {
        commentList.innerHTML = '<p>리뷰가 없습니다.</p>';
    }
}