# Copy Drawing Style

AI를 활용한 그림 스타일 완전 분석 도구입니다. 이미지를 업로드하면 상세한 스타일 분석을 통해 동일한 스타일의 그림을 그릴 수 있는 프롬프트를 생성합니다.

## 기능

- 이미지 드래그 앤 드롭 업로드
- 여러 이미지 동시 분석
- 상세한 그림 스타일 분석 (선화, 채색, 음영, 비율, 질감 등)
- 바로 사용 가능한 프롬프트 생성
- 클립보드 복사 기능

## 기술 스택

- **프론트엔드**: HTML5, CSS3, Vanilla JavaScript
- **백엔드**: Cloudflare Pages Functions (Workers)
- **AI API**: Alibaba Cloud DashScope (Qwen-VL-Max)

## 배포 가이드

### 1. Cloudflare Pages 설정

1. [Cloudflare Pages](https://pages.cloudflare.com/) 로그인
2. "Create a project" > "Connect to Git" 선택
3. 이 레포지토리 연결
4. Build settings:
   - Build command: (비워둠)
   - Build output directory: `/`

### 2. 환경 변수 설정

Cloudflare Pages 대시보드에서:
1. 프로젝트 > Settings > Environment variables
2. `DASHSCOPE_API_KEY` 추가
   - Alibaba Cloud DashScope API 키 입력

### 3. DashScope API 키 발급

1. [Alibaba Cloud](https://dashscope.console.aliyun.com/) 접속
2. 계정 생성 및 로그인
3. DashScope 서비스 활성화
4. API Key 생성

## 로컬 개발

### 필요 조건

- Node.js 18+
- Cloudflare Wrangler CLI

### 설정

```bash
# Wrangler 설치
npm install -g wrangler

# 프로젝트 클론
git clone <repository-url>
cd copy-drawing-style

# 환경변수 설정 (.env 파일 생성)
echo "DASHSCOPE_API_KEY=your-api-key-here" > .env

# 로컬 개발 서버 시작
wrangler pages dev . --compatibility-date=2024-01-15
```

### 환경변수 파일 예시

`.env` 파일을 생성하고 다음 내용을 추가:

```
DASHSCOPE_API_KEY=your-dashscope-api-key-here
```

## 사용법

1. 웹사이트 접속
2. 분석하고 싶은 그림 이미지 업로드 (드래그 앤 드롭 또는 파일 선택)
3. "스타일 분석 시작" 버튼 클릭
4. 분석 완료 후 생성된 프롬프트를 복사하여 사용

## 분석 요소

- **선화**: 선의 굵기, 강약, 펜 압력, 끝처리 방식
- **형태와 비율**: 인체 비율, 얼굴 특징, 데포르메 정도
- **렌더링**: 셀 셰이딩, 색상 팔레트, 그라데이션
- **음영**: 광원 설정, 그림자 처리, 반사광
- **질감**: 머리카락, 옷감, 피부 표현
- **스타일 시그니처**: 눈, 코, 입, 배경 처리
- **기술적 세부사항**: 브러시, 블렌딩, 후처리 효과

## 라이선스

MIT License

## 기여하기

이슈 리포트와 풀 리퀘스트를 환영합니다.
