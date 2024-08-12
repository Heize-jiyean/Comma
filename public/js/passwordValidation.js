function checkPassword(password) {
    console.log('Validating password:', password);
    const hasMinLength = password.length >= 8 && password.length <= 16;
    const hasNumber = /\d/.test(password);
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    console.log('Validation results:', {
        hasMinLength,
        hasNumber,
        hasLetter,
        hasSpecialChar
    });

    if (!(hasMinLength && hasNumber && hasLetter && hasSpecialChar)) {
        console.log('Password validation failed');
        return '8~16자의 영문 대/소문자, 숫자, 특수문자를 사용해 주세요.';
    }
    console.log('Password validation passed');
    return null;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { checkPassword };
} else {
    window.checkPassword = checkPassword;
}