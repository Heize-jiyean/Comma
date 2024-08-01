document.addEventListener('DOMContentLoaded', function() {
    const logoutButton = document.getElementById('logout-button');
    const logoutLoading = document.getElementById('logout-loading');

    if (logoutButton) {
        logoutButton.addEventListener('click', async function(e) {
            e.preventDefault();
            
            // 로딩 상태 표시
            logoutButton.style.display = 'none';
            logoutLoading.style.display = 'inline';

            try {
                const response = await fetch('/auth/logout', { 
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                const result = await response.json();

                if (result.success) {
                    alert(result.message);
                    window.location.href = '/auth/login'; // 로그인 페이지로 리다이렉트
                } else {
                    alert(result.error || '로그아웃 중 오류가 발생했습니다.');
                }
            } catch (error) {
                console.error('Logout error:', error);
                alert('로그아웃 중 오류가 발생했습니다.');
            } finally {
                // 로딩 상태 숨기기
                logoutButton.style.display = 'inline';
                logoutLoading.style.display = 'none';
            }
        });
    }
});