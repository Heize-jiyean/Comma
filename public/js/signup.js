document.addEventListener('DOMContentLoaded', function() {

    // 출생연도에 1950년 이후 넣기
    const birthYearSelect = document.getElementById('birth-year');
    const currentYear = new Date().getFullYear();
    for (let year = 1950; year <= currentYear; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        birthYearSelect.appendChild(option);
    }

    // 역할 선택 시 추가되는 화면 구성
    const doctorRadio = document.getElementById('doctor');
    const patientRadio = document.getElementById('patient');
    const infoContainer = document.getElementById('addtional-info');

    // 추가 필드 생성-의사
    function addDoctorInfo() {
        infoContainer.style.display = 'block';
        const specialtyLabel = document.createElement('label');
        specialtyLabel.setAttribute('for', 'specialty');
        specialtyLabel.textContent = '전문의';

        const specialtyInput = document.createElement('input');
        specialtyInput.setAttribute('type', 'text');
        specialtyInput.setAttribute('id', 'specialty');
        specialtyInput.setAttribute('name', 'specialty');

        // 추가 필드를 컨테이너에 추가
        infoContainer.appendChild(specialtyLabel);
        infoContainer.appendChild(specialtyInput);
    }

    // 추가 필드 생성-환자
    function addPatientInfo() {
        infoContainer.style.display = 'block';
        const specialtyLabel = document.createElement('label');
        specialtyLabel.setAttribute('for', 'job');
        specialtyLabel.textContent = '직업';

        const specialtyInput = document.createElement('input');
        specialtyInput.setAttribute('type', 'text');
        specialtyInput.setAttribute('id', 'job');
        specialtyInput.setAttribute('name', 'job');

        // 추가 필드를 컨테이너에 추가
        infoContainer.appendChild(specialtyLabel);
        infoContainer.appendChild(specialtyInput);
    }

    // 추가 필드 제거
    function removeInfo() {
        infoContainer.style.display = 'none';
        while (infoContainer.firstChild) {
            infoContainer.removeChild(infoContainer.firstChild);
        }
    }

    // 의사 클릭 시
    doctorRadio.addEventListener('change', function() {
        if (doctorRadio.checked) {
            removeInfo();
            addDoctorInfo();
        }
    });

    // 환자 클릭 시
    patientRadio.addEventListener('change', function() {
        if (patientRadio.checked) {
            removeInfo();
            addPatientInfo()
        }
    });
});

// 이메일 중복 확인
async function checkEmailDuplicate(email) {
    const data = { 'email': email };

    const response = await fetch("/auth/check-email", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    })
    const isDuplicate = await response.json();
    console.log(isDuplicate.isDuplicate);
    return isDuplicate.isDuplicate;
}

// 인증 이메일 보내기
async function sendAuthEmail() {
    const email = document.getElementById("email").value;
    const emailError = document.getElementById("email_error")

    // 이메일 입력 확인
    if (!email) {
        emailError.textContent = '이메일을 입력해 주세요.';
        emailError.style.display = 'inline';
        return false;
    }

    // 이메일 중복 확인
    if (await checkEmailDuplicate(email)) {
        emailError.textContent = '사용 중인 이메일입니다.';
        emailError.style.display = 'inline';
        return false;
    }

}