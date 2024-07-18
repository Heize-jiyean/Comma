let authNum;

document.addEventListener('DOMContentLoaded', function () {

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

        const experienceLabel = document.createElement('label');
        experienceLabel.setAttribute('for', 'experience');
        experienceLabel.textContent = '경력';

        const experienceInput = document.createElement('input');
        experienceInput.setAttribute('type', 'text');
        experienceInput.setAttribute('id', 'experience');
        experienceInput.setAttribute('name', 'experience');

        // 추가 필드를 컨테이너에 추가
        infoContainer.appendChild(specialtyLabel);
        infoContainer.appendChild(specialtyInput);
        infoContainer.appendChild(experienceLabel);
        infoContainer.appendChild(experienceInput);
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
        infoContainer.innerHTML = '';
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

    // 아이디 입력 시 유효성 검사 진행
    document.getElementById('id').addEventListener('blur', checkId);

    // 폼 제출 시 유효성 검사 진행
    const form = document.getElementById('form');
    form.addEventListener('submit', async function (event) {
        event.preventDefault(); // 기본 동작(페이지 새로고침)을 막습니다.

        const passwordValid = checkPassword();
        const emailValid = checkAuthCode();
        const idValid = await checkId();
        const nicknameValid = checkNickname();
        const genderValid = checkgender();
        const ageValid = checkAge();
        const roleValid = checkrole();

        if (passwordValid && emailValid && idValid && nicknameValid && genderValid && ageValid && roleValid) {
            alert('회원가입이 완료되었습니다.');

            // email입력 부분도 form데이터로 전송하기 위해 disabled 제거
            const emailInput = document.getElementById("email")
            emailInput.disabled = false;

            // 최종 제출
            form.submit()
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
    const emailInput = document.getElementById("email")
    const email = document.getElementById("email").value;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const emailError = document.getElementById("email_error")

    const emailCheckInput = document.getElementById("check_email");
    const checkEmailBtn = document.getElementById("check_email_btn");

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
    // 인증 이메일 전송
    else {
        emailError.style.display = 'none';
        try {
            document.body.style.cursor = 'wait';
            const data = { 'email': email };
            const response = await fetch("/auth/send-auth", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            })

            const result = await response.json();
            document.body.style.cursor = 'default';
            if (result.ok) {
                alert("인증번호가 발송되었습니다.");
                authNum = result.authNum;

                emailInput.disabled = true;
                emailCheckInput.disabled = false;
                checkEmailBtn.classList.remove("disabled-button");
                checkEmailBtn.style.pointerEvents = 'auto';
            } else {
                emailError.textContent = result.msg;
            }
        } catch (err) {
            alert("인증번호 발송에 실패하였습니다.");
        }

    }

}

// 인증번호 유효성 검사
function checkAuthCode() {
    const checkEmail = document.getElementById("check_email").value;
    const emailCheckError = document.getElementById("email_check_error")

    // 인증번호가 입력되었는지 확인
    if (!checkEmail) {
        emailCheckError.textContent = "인증번호를 입력해주세요.";
        emailCheckError.style.display = 'inline';
        emailCheckError.style.color = '#f86550';
        return false;
    }

    // 인증번호 확인 로직
    // checkEmail은 string이고 authNum은 int타입이라 == 사용
    if (checkEmail == authNum) {
        emailCheckError.textContent = "인증번호 확인이 완료되었습니다.";
        emailCheckError.style.display = 'inline';
        emailCheckError.style.color = 'blue';
        return true;
    } else {
        emailCheckError.textContent = '인증번호를 다시 확인해주세요.';
        emailCheckError.style.display = 'inline';
        emailCheckError.style.color = '#f86550';
        return false;
    }

}

// 아이디 중복 확인
async function checkIdDuplicate(id) {
    const data = { 'id': id };

    const response = await fetch("/auth/check-id", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    })
    const isDuplicate = await response.json();
    return isDuplicate.isDuplicate;
}

// 아이디 유효성 검사
async function checkId() {
    const id = document.getElementById("id").value;
    const idError = document.getElementById("id_error")
    const idPattern = /^[a-zA-Z0-9_]+$/;

    // 아이디 입력 확인
    if (!id) {
        idError.textContent = '아이디를 입력해 주세요.';
        idError.style.display = 'inline';
        return false;
    }
    else if (id.length > 10) {
        idError.textContent = '아이디는 10자 이하로 입력해 주세요.';
        idError.style.display = 'inline';
        return false;
    }
    else if (!idPattern.test(id)) {
        idError.textContent = '아이디는 영어, 숫자, 언더바만 사용 가능합니다.';
        idError.style.display = 'inline';
        return false;
    }
    // 아이디 중복 확인
    else if (await checkIdDuplicate(id)) {
        idError.textContent = '사용 중인 아이디입니다.';
        idError.style.display = 'inline';
        return false;
    }

    else {
        idError.style.display = 'none';
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
function checkNickname() {
    const nickname = document.getElementById("nickname").value;
    const nicknameError = document.getElementById("nickname_error")

    // 이름 입력 확인
    if (!nickname) {
        nicknameError.textContent = '닉네임을 입력해 주세요.'
        nicknameError.style.display = 'inline';
        return false;
    }
    else if (nickname.length > 12) {
        idError.textContent = '닉네임은 12자 이하로 입력해 주세요.';
        idError.style.display = 'inline';
        return false;
    }
    else {
        nicknameError.style.display = 'none';
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