# Insights Huny – Netlify용 React 프론트엔드

Netlify 환경에서 빠르게 배포할 수 있는 React + Vite 기반의 초기 랜딩 페이지 프로젝트입니다. 현재는 인사이트 대시보드의 프리뷰 화면만 제공하며, 향후 기능을 확장할 수 있도록 기본적인 빌드 구성과 라우팅 설정(Netlify SPA 리다이렉션 포함)이 세팅되어 있습니다.

## 개발 환경

- Node.js 18 이상
- React 19 / Vite 7 / TypeScript 5
- ESLint 기본 구성

## 시작하기

```bash
npm install
npm run dev
```

위 명령을 실행한 후 브라우저에서 `http://localhost:5173` 에 접속하면 초기 랜딩 페이지를 확인할 수 있습니다.

## 빌드 & 배포

### 로컬 빌드

```bash
npm run build
npm run preview
```

`npm run build`는 `dist/` 디렉터리에 정적 파일을 생성합니다. `npm run preview`로 프로덕션 번들을 로컬에서 검증할 수 있습니다.

### Netlify 배포

- `netlify.toml`에 빌드 명령(`npm run build`)과 배포 디렉터리(`dist`)가 정의되어 있습니다.
- 단일 페이지 애플리케이션 라우팅을 위해 Netlify 리다이렉션(`/* -> /index.html 200`)이 설정되어 있습니다.
- Netlify 대시보드에서 저장소를 연결하면 자동으로 빌드 및 배포가 진행됩니다.

추가로 필요하다면 Netlify CLI를 통해 수동 배포도 가능합니다.

```bash
npm install -g netlify-cli
netlify deploy --build
```

## 디렉터리 구조

```
├── public/           # 정적 자산 (favicon 등)
├── src/              # React 소스 코드
│   ├── App.tsx       # 메인 랜딩 페이지 컴포넌트
│   ├── App.css       # 랜딩 페이지 스타일
│   ├── index.css     # 전역 스타일
│   └── main.tsx      # React 엔트리 포인트
├── netlify.toml      # Netlify 빌드 및 리다이렉션 설정
├── package.json      # npm 스크립트 및 의존성
└── tsconfig*.json    # TypeScript 설정
```

## 향후 작업 아이디어

- 실제 데이터 연동을 위한 API 클라이언트 추가
- CI/CD 파이프라인(예: GitHub Actions)과 연동
- 다국어 지원 및 접근성 향상