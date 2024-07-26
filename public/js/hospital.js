// 네이버 지도 초기화 (실제 좌표로 대체 필요)
const map = new naver.maps.Map('map', {
    center: new naver.maps.LatLng(37.5665, 126.9780),
    zoom: 15
});

console.log('Hospitals data:', document.getElementById('hospitalsData').value); // 디버깅 로그 추가
const hospitalsData = document.getElementById('hospitalsData').value;
let hospitals = JSON.parse(hospitalsData);
console.log('Parsed hospitals:', hospitals); // 디버깅 로그 추가
if (!Array.isArray(hospitals)) {
    hospitals = [hospitals]; // 단일 객체인 경우 배열로 변환
}
console.log('Processed hospitals:', hospitals); // 디버깅 로그 추가

if (hospitals.length > 0) {
    hospitals.forEach(hospital => {
        console.log('Creating marker for hospital:', hospital); // 디버깅 로그 추가
        const position = new naver.maps.LatLng(hospital.latitude, hospital.longitude);
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
        console.log('Search form submitted'); // 디버깅용 로그

        const searchQuery = form.querySelector('input[name="search"]').value;
        console.log('Search query:', searchQuery); // 디버깅용 로그

        try {
            console.log('Sending fetch request'); // 디버깅용 로그
            const response = await fetch(`/hospital/search?query=${encodeURIComponent(searchQuery)}`);

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            console.log('Search response:', data); // 디버깅용 로그

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
        <p>전화번호: ${hospital.phone ? `${hospital.phone}` : '정보 없음'}</p>
        <p>웹사이트: ${hospital.website ? `<a href="${hospital.website}" target="_blank">${hospital.website}</a>` : '정보 없음'}</p>
        <button onclick="writeReview('${hospital.name}', ${hospital.hospital_id})" 
                data-hospital-name="${hospital.name}" 
                data-hospital-id="${hospital.hospital_id}" 
                class="btn btn-primary">리뷰 쓰기</button>
    `;
}

function writeReview(hospitalName, hospitalId) {
    const modal = new bootstrap.Modal(document.getElementById('reviewModal'));
    document.querySelector('#reviewModal [name="name"]').value = hospitalName;
    document.querySelector('#reviewModal [name="hospital_id"]').value = hospitalId;
    modal.show();
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

//리뷰 제출 함수
async function submitReview() {
    const form = document.getElementById('hospitalForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const formData = new FormData(form);
    const reviewData = {
        hospital_id: formData.get('hospital_id'),
        patient_id: 1, // 임시로 1로 설정. 실제로는 로그인한 사용자의 ID를 사용해야 합니다.
        content: formData.get('description')
    };

    try {
        const response = await fetch('/hospital/review/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(reviewData),
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const newReviews = await response.json();
        updateReviewList(newReviews);
        
        // 모달 닫기
        const modal = bootstrap.Modal.getInstance(document.getElementById('reviewModal'));
        modal.hide();

        // 폼 리셋
        form.reset();
    } catch (error) {
        console.error('Error:', error);
        alert('리뷰 제출 중 오류가 발생했습니다.');
    }
}