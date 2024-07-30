// 네이버 지도 초기화 (실제 좌표로 대체 필요)
const map = new naver.maps.Map('map', {
    center: new naver.maps.LatLng(37.5665, 126.9780),
    zoom: 13
});

// 사용자의 현재 위치를 가져와서 지도 중심 설정
// JavaScript의 Geolocation API 사용
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(position => {
        const userLocation = new naver.maps.LatLng(position.coords.latitude, position.coords.longitude);
        map.setCenter(userLocation);

        // 초기 마커 업데이트 호출
        updateMarkers(map, markerInfo);
    }, error => {
        console.error('Geolocation error: ', error);
    });
} else {
    console.error('Geolocation is not supported by this browser.');
}

// 병원 정보 객체 불러오기
const hospitalsData = document.getElementById('hospitalsData').value;
let hospitals = JSON.parse(hospitalsData);
if (!Array.isArray(hospitals)) {
    hospitals = [hospitals]; // 단일 객체인 경우 배열로 변환
}

// 마커 및 인포윈도우 정보를 담을 배열
let markerInfo = [];

if (hospitals.length > 0) {
    hospitals.forEach(hospital => {
        const position = new naver.maps.LatLng(hospital.latitude, hospital.longitude);
        // 기본 제공 마커 생성
        const marker = new naver.maps.Marker({
            position: position,
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

        // 마커, 인포윈도우, 그리고 contentString을 병원 ID와 함께 객체로 저장
        markerInfo.push({
            hospitalId: hospital.hospital_id,
            marker: marker,
            infowindow: infowindow,
        });

        // 마커 클릭 시 인포윈도우 열기
        naver.maps.Event.addListener(marker, 'click', () => {
            // 클릭한 마커의 인포윈도우 열기
            infowindow.open(map, marker);
            // 병원 정보 로딩
            updateHospitalInfo(hospital)
            // 코멘트 가져오기
            collectCommentHospital(hospital.hospital_id)
        });
    });
}


// 맵이 idle 상태일 때 보이는 영역의 마커를 업데이트
naver.maps.Event.addListener(map, 'idle', function () {
    updateMarkers(map, markerInfo);
});

function updateMarkers(map, markerInfo) {
    var mapBounds = map.getBounds();
    var marker, position;

    for (var i = 0; i < markerInfo.length; i++) {
        marker = markerInfo[i].marker;
        position = marker.getPosition();

        if (mapBounds.hasLatLng(position)) {
            showMarker(map, marker);
        } else {
            hideMarker(map, marker);
        }
    }
}

function showMarker(map, marker) {
    if (marker.getMap()) return;
    marker.setMap(map);
}

function hideMarker(map, marker) {
    if (!marker.getMap()) return;
    marker.setMap(null);
}

let cache = ''; // 캐시 초기화
let checkInputInterval; // 인터벌 ID를 저장할 변수

const form = document.querySelector('form[role="search"]');
const searchInput = form.querySelector('input[name="search"]');
const hospitalInfoDiv = document.getElementById('hospitalInfo');
const ul = document.querySelector(".pop_rel_keywords");
const relContainer = document.querySelector(".rel_search");

// 입력값을 확인할 인터벌을 설정합니다
const startCheckingInput = () => {
    checkInputInterval = setInterval(() => {
        const inputValue = searchInput.value;

        // 입력값이 변경된 경우에만 처리
        if (inputValue !== cache) {
            cache = inputValue;
            loadData(inputValue); // 입력값이 변경된 경우 데이터 로드
        }

        // 추천 검색어 리스트 숨기기/보이기
        if (inputValue === "") {
            relContainer.classList.add("hide");
        } else {
            relContainer.classList.remove("hide");
        }
    }, 500); // 0.5초마다 체크
};

// 입력값 확인 시작
startCheckingInput();

// 입력값 확인 중단 함수
const stopCheckingInput = () => {
    if (checkInputInterval) {
        clearInterval(checkInputInterval);
    }
};

// 병원 관련 자동검색어 완성 함수
const loadData = async (input) => {
    console.log('Fetching data for:', input); // 요청 로그
    try {
        const response = await fetch(`/hospital/autocomplete?query=${encodeURIComponent(input)}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        console.log('Data received:', data); // 응답 데이터 로그
        updateAutocompleteList(data.suggestions);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
};

// 검색어 자동완성 목록을 업데이트합니다
const updateAutocompleteList = (suggestions) => {
    ul.innerHTML = ''; // 기존 목록 초기화
    if (suggestions.length > 0) {
        suggestions.forEach((suggestion) => {
            const li = document.createElement('li');
            li.textContent = suggestion;
            li.addEventListener('click', () => {
                searchInput.value = suggestion;
                relContainer.classList.add("hide");
            });
            ul.appendChild(li);
        });
        relContainer.classList.remove("hide"); // 추천 검색어 리스트 표시
    } else {
        relContainer.classList.add("hide"); // 추천 검색어 리스트 숨기기
    }
};

// 검색 시 병원 정보 가져오기
form.addEventListener('submit', async (event) => {
    event.preventDefault(); // 페이지 새로고침 방지
    const searchQuery = searchInput.value;

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

// 페이지가 unload될 때 체크를 멈추는 함수 호출
window.addEventListener('beforeunload', stopCheckingInput);

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
        <p>웹사이트: ${hospital.website ? `<a href="https://${hospital.website}" target="_blank">${hospital.website}</a>` : '정보 없음'}</p>
        <button onclick="writeReview('${hospital.name}', ${hospital.hospital_id})" 
                data-hospital-name="${hospital.name}" 
                data-hospital-id="${hospital.hospital_id}" 
                class="btn btn-primary">리뷰 쓰기</button>
    `;
}

function writeReview(hospitalName, hospitalId) {
    document.querySelector('#reviewModal [name="name"]').value = hospitalName;
    document.querySelector('#reviewModal [name="hospital_id"]').value = hospitalId;
    const modal = new bootstrap.Modal(document.getElementById('reviewModal'));
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