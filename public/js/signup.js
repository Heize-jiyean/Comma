document.addEventListener('DOMContentLoaded', function () {

    // 출생연도에 1950년 이후 넣기
    const birthYearSelect = document.getElementById('birth-year');
    const currentYear = new Date().getFullYear();
    for (let year = 1; year <= currentYear; year++) {
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
    doctorRadio.addEventListener('change', function () {
        if (doctorRadio.checked) {
            removeInfo();
            addDoctorInfo();
        }
    });

    // 환자 클릭 시
    patientRadio.addEventListener('change', function () {
        if (patientRadio.checked) {
            removeInfo();
            addPatientInfo()
        }
    });

    // 닉네임 입력 시 유효성 검사 진행
    document.getElementById('nickname').addEventListener('blur', checkNickname);

    // 폼 제출 시 유효성 검사 진행
    const form = document.getElementById('form');
    form.addEventListener('submit', async function (event) {
        console.log("되고있나요?")
        event.preventDefault(); // 기본 동작(페이지 새로고침)을 막습니다.
    
        const passwordValid = checkPassword();
        const eamilValid = await sendAuthEmail();
        const nicknameValid = await checkNickname();
        const nameValid = checkName();
        const genderValid = checkgender();
        const ageValid = checkAge();
        const roleValid = checkrole();
    
        if (passwordValid && eamilValid && nicknameValid && nameValid && genderValid && ageValid && roleValid) {
            form.submit();
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
    return isDuplicate.isDuplicate;
}

// 인증 이메일 보내기
async function sendAuthEmail() {
    const email = document.getElementById("email").value;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const emailError = document.getElementById("email_error")

    // 이메일 입력 확인
    if (!email) {
        emailError.textContent = '이메일을 입력해 주세요.';
        emailError.style.display = 'inline';
        return false;
    } else if (!emailPattern.test(email)) {
        emailError.textContent = '이메일 형식이 올바르지 않습니다.';
        emailError.style.display = 'inline';
        return false;
    }
    // 이메일 중복 확인
    else if (await checkEmailDuplicate(email)) {
        emailError.textContent = '사용 중인 이메일입니다.';
        emailError.style.display = 'inline';
        return false;
    }
    // 인증 이메일 전송 (이메일 전송 현재 미 구현)
    else {
        emailError.style.display = 'none';
        return true;
    }

}

// 닉네임 중복 확인
async function checkNicknameDuplicate(nickname) {
    const data = { 'nickname': nickname };

    const response = await fetch("/auth/check-nickname", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    })
    const isDuplicate = await response.json();
    return isDuplicate.isDuplicate;
}

// 닉네임 유효성 검사
async function checkNickname() {
    const nickname = document.getElementById("nickname").value;
    const nicknameError = document.getElementById("nickname_error")

    // 닉네임 입력 확인
    if (!nickname) {
        nicknameError.textContent = '닉네임을 입력해 주세요.';
        nicknameError.style.display = 'inline';
        return false;
    }

    // 닉네임 중복 확인
    else if (await checkNicknameDuplicate(nickname)) {
        nicknameError.textContent = '사용 중인 닉네임입니다.';
        nicknameError.style.display = 'inline';
        return false;
    }

    else {
        nicknameError.style.display = 'none';
        return true;
    }
}

// 비밀번호 유효성 검사
function checkPassword() {
    const password = document.getElementById("password").value;
    const passwordError = document.getElementById("password_error")
    const confirm_password = document.getElementById("confirm_password").value;
    const confirm_passwordError = document.getElementById("password_confirm_error");

    const hasMinLength = password.length >= 8 && password.length <= 16;
    const hasNumber = /\d/.test(password);
    const hasLetter = /[a-zA-Z]/.test(password);

    // 비밀번호 입력 확인
    if (!password) {
        passwordError.textContent = '비밀번호를 입력해 주세요.'
        passwordError.style.display = 'inline';
        return false;
    }
    // 비밀번호 형식 확인
    else if (!(hasMinLength && hasNumber && hasLetter)) {
        passwordError.textContent = '8~16자의 영문 대/소문자, 숫자, 특수문자를 사용해 주세요.'
        passwordError.style.display = 'inline';
        return false;
    }
    // 비밀번호 재확인 입력 확인
    else if (password != confirm_password) {
        confirm_passwordError.textContent = '비밀번호가 일치하지 않습니다.'
        passwordError.style.display = 'none';
        confirm_passwordError.style.display = 'inline';
        return false
    }
    else {
        passwordError.style.display = 'none';
        confirm_passwordError.style.display = 'none';
        return true
    }
}

// 나머지 항목 유효성 검사
function checkName() {
    const name = document.getElementById("name").value;
    const nameError = document.getElementById("name_error")

    // 이름 입력 확인
    if (!name) {
        nameError.textContent = '이름을 입력해 주세요.'
        nameError.style.display = 'inline';
        return false;
    }
    else {
        nameError.style.display = 'none';
        return true
    }
}

function checkgender() {
    const gender = document.getElementById('gender').value;
    const genderError = document.getElementById("gender_error")

    // 성별 입력 확인
    if (!gender) {
        genderError.textContent = '성별을 선택해 주세요.'
        genderError.style.display = 'inline';
        return false;
    }
    else {
        genderError.style.display = 'none';
        return true
    }
}

function checkAge() {
    const age = document.getElementById('birth-year').value;
    const ageError = document.getElementById("age_error")

    // 나이 입력 확인
    if (!age) {
        ageError.textContent = '출생연도를 선택해 주세요.'
        ageError.style.display = 'inline';
        return false;
    }
    else {
        ageError.style.display = 'none';
        return true
    }
}

function checkrole() {
    const selectedRole = document.querySelector('input[name="role"]:checked');
    const roleError = document.getElementById("role_error")

    // 포지션 입력 확인
    if (!selectedRole) {
        roleError.textContent = '포지션을 선택해 주세요.'
        roleError.style.display = 'inline';
        return false;
    }
    else {
        roleError.style.display = 'none';
        return true
    }
}