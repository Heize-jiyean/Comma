exports.renderRegisterPage = (req, res) => {
    console.log('Rendering register page with Naver Map Client ID:', process.env.NAVER_MAP_CLIENT_ID);
    if (!process.env.NAVER_MAP_CLIENT_ID) {
        console.error('NAVER_MAP_CLIENT_ID is not set in environment variables');
    }
    res.render('hospital/register', {
        naverMapClientId: process.env.NAVER_MAP_CLIENT_ID || ''
    });
};