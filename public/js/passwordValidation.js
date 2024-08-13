function checkPassword(password) {
    console.log('Validating password:', password);
    const hasMinLength = password.length >= 8 && password.length <= 16;
    const hasNumber = /\d/.test(password);
    const hasLetter = /[a-zA-Z]/.test(password);

    console.log('Validation results:', {
        hasMinLength,
        hasNumber,
        hasLetter
    });

    if (!password) {
        return '비밀번호를 입력해 주세요.';
    } else if (!(hasMinLength && hasNumber && hasLetter)) {
        return '8~16자의 영문 대/소문자, 숫자를 사용해 주세요.';
    }
    
    console.log('Password validation passed');
    return null;
}

// 브라우저 환경과 Node.js 환경 모두에서 동작하도록 수정
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { checkPassword };
} else {
    window.checkPassword = checkPassword;
}