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

    // 추가 필드 생성
    function addAdditionalFields() {
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

    // 추가 필드 제거
    function removeAdditionalFields() {
        infoContainer.style.display = 'none';
        while (infoContainer.firstChild) {
            infoContainer.removeChild(infoContainer.firstChild);
        }
    }

    // 의사 클릭 시
    doctorRadio.addEventListener('change', function() {
        if (doctorRadio.checked) {
            addAdditionalFields();
        }
    });

    // 환자 클릭 시
    patientRadio.addEventListener('change', function() {
        if (patientRadio.checked) {
            removeAdditionalFields();
        }
    });
});