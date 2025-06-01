document.addEventListener('DOMContentLoaded', () => {
    const weatherInfo = document.getElementById('weather-info');
    const outfitSuggestions = document.getElementById('outfit-suggestions');
    const refreshButton = document.getElementById('refresh-button');

    // OpenWeatherMap API 키
    const API_KEY = 'ee77d58e8f7e8993aa0a4927afe75536';

    // 날씨 정보 가져오기
    async function getWeather() {
        try {
            // 현재 위치 가져오기
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject);
            });

            const { latitude, longitude } = position.coords;

            // 날씨 API 호출
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`
            );

            const data = await response.json();

            // 날씨 정보 표시
            weatherInfo.innerHTML = `
                <p>현재 기온: ${Math.round(data.main.temp)}°C</p>
                <p>날씨: ${data.weather[0].description}</p>
            `;

            // 기온에 따른 코디 추천
            suggestOutfit(data.main.temp);
        } catch (error) {
            console.error('날씨 정보를 가져오는데 실패했습니다:', error);
            weatherInfo.innerHTML = '<p>날씨 정보를 가져올 수 없습니다.</p>';
        }
    }

    // 기온에 따른 코디 추천
    function suggestOutfit(temperature) {
        let suggestions = [];

        if (temperature < 5) {
            suggestions = [
                '두꺼운 패딩',
                '목도리',
                '장갑',
                '두꺼운 바지'
            ];
        } else if (temperature < 15) {
            suggestions = [
                '코트',
                '니트',
                '청바지',
                '스니커즈'
            ];
        } else if (temperature < 25) {
            suggestions = [
                '자켓',
                '티셔츠',
                '청바지',
                '운동화'
            ];
        } else {
            suggestions = [
                '반팔 티셔츠',
                '반바지',
                '샌들',
                '썬글라스'
            ];
        }

        // 추천 코디 표시
        outfitSuggestions.innerHTML = suggestions
            .map(item => `<div class="outfit-item">${item}</div>`)
            .join('');
    }

    // 새로고침 버튼 클릭 시
    refreshButton.addEventListener('click', getWeather);

    // 초기 날씨 정보 로드
    getWeather();
}); 