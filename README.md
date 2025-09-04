# Copy Drawing Style

AI를 활용한 그림체 복사 전문 도구입니다. 이미지를 업로드하면 시각적 스타일만을 정확히 분석하여 동일한 그림체로 그릴 수 있는 실행 가능한 프롬프트를 생성합니다.

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
2. 복사하고 싶은 그림체의 이미지 업로드 (드래그 앤 드롭 또는 파일 선택)
3. "스타일 분석 시작" 버튼 클릭
4. AI가 각 이미지를 개별 분석 후 종합하여 완성된 스타일 복사 프롬프트 생성
5. 생성된 프롬프트를 복사해서 Stable Diffusion, Midjourney 등 AI 아트 도구에서 바로 사용

**결과물**: 동일한 그림체로 그릴 수 있는 구체적이고 실행 가능한 영어 프롬프트

## 그림체 복사 분석 요소

**시각적 특징 추출에 집중:**
- **선화 스타일**: 선 굵기 변화, 끝처리, 스케치감, 압력 감도
- **채색 방법**: 플랫 컬러 vs 그라데이션, 셀 셰이딩 vs 소프트 페인팅
- **음영/조명 기법**: 하드 vs 소프트 그림자, 광원 동작, 대비 레벨
- **비율과 해부학**: 머리-몸 비율, 얼굴 특징 크기와 위치, 스타일화 정도
- **디테일 렌더링**: 머리카락 질감, 옷 주름, 피부 렌더링, 눈 디자인
- **색상 팔레트**: 주요 색상, 색상 관계, 명도/채도 경향
- **시각적 질감**: 표면 처리, 브러시 스트로크, 마감 품질
- **스타일 분류**: 애니메, 만화, 사실적, 벡터 등 기존 스타일과의 유사성

**감정이나 스토리가 아닌 순전히 복사 가능한 시각적 기법에만 집중**

## 라이선스

MIT License

## 기여하기

이슈 리포트와 풀 리퀘스트를 환영합니다.
