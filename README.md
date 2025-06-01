# Fashion Closet

Fashion Closet는 사용자의 옷장을 디지털화하고 AI 기반의 코디 추천을 제공하는 웹 애플리케이션입니다.

## 주요 기능

- 🌤️ 날씨 기반 코디 추천
- 👔 옷장 디지털 관리
- 🎨 AI 기반 스타일 추천
- 📱 반응형 디자인

## 기술 스택

- Frontend: Next.js 14, React, TypeScript
- Styling: Tailwind CSS, shadcn/ui
- API: OpenWeatherMap API
- State Management: React Hooks, Context API

## 시작하기

1. 저장소 클론
```bash
git clone [GitHub 저장소 URL]
```

2. 의존성 설치
```bash
npm install
```

3. 개발 서버 실행
```bash
npm run dev
```

4. 브라우저에서 확인
```
http://localhost:3000
```

## 프로젝트 구조

```
MyFashionCloset/
├── index.html          # 메인 페이지
├── closet.html         # 옷장 관리 페이지
├── outfit.html         # 코디 추천 페이지
├── contact.html        # 문의 페이지
├── css/               # 스타일시트
│   └── style.css
├── js/                # 자바스크립트 파일
│   ├── closet.js      # 옷장 관리 로직
│   ├── outfit.js      # 코디 추천 로직
│   └── main.js        # 공통 로직
├── assets/            # 정적 파일
│   ├── images/        # 이미지 파일
│   ├── videos/        # 비디오 파일
│   └── fonts/         # 폰트 파일
├── prd.pdf           # PRD 문서
└── README.md         # 프로젝트 설명
```

## 환경 설정

1. `.env.local` 파일 생성
```
NEXT_PUBLIC_OPENWEATHER_API_KEY=your_api_key
```

2. OpenWeatherMap API 키 발급
- [OpenWeatherMap](https://openweathermap.org/)에서 API 키 발급

## 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 연락처

프로젝트 관리자 - [이메일 주소]

프로젝트 링크: [GitHub 저장소 URL]
