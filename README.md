# Copy Drawing Style

그림체를 정확히 복사하기 위한 AI 분석 도구입니다. 이미지를 업로드하면 최신 AI 모델(GPT-4o, FLUX, Midjourney v7, Claude 3.5)이 그림체 특징을 분석하여 동일한 스타일로 그림을 그릴 수 있는 복사용 프롬프트를 생성합니다.

## 기능

- 이미지 드래그 앤 드롭 업로드 (최대 20개)
- 개별 이미지 분석 후 종합 분석
- 그림체 복사에 특화된 시각적 특징 분석
- 동일한 스타일로 그릴 수 있는 정확한 복사용 프롬프트 생성
- 원클릭 클립보드 복사 기능

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

## 🚀 그림체 복사 특화 분석 프로세스

1. **시각적 특징 분석**: 각 이미지의 순수한 그림체 특징만 추출 (선화, 채색, 비율 등)
2. **스타일 복사 명세서**: 그림체를 정확히 재현하기 위한 구체적 지침 생성
3. **통합 복사 프롬프트**: 모든 분석을 종합하여 완벽한 그림체 복사용 프롬프트 생성
4. **즉시 적용**: GPT-4o, FLUX, Midjourney v7, Claude 3.5 등에서 동일한 그림체로 그림 생성

## 사용법

1. 웹사이트 접속
2. 분석하고 싶은 그림 이미지 업로드 (드래그 앤 드롭, 최대 20개)
3. "스타일 분석 시작" 버튼 클릭
4. AI가 생성한 그림체 복사 프롬프트를 복사하여 최신 AI 이미지 생성 도구에 사용

## 분석 요소 (그림체 복사 특화)

- **선화 스타일**: 선의 두께, 질감, 끝처리, 압력감, 전체적 선 품질
- **채색 방식**: 평면 vs 그라데이션, 셀셰이딩 vs 페인팅, 색상 적용법
- **음영 처리**: 그림자 형태, 하이라이트 위치, 대비 수준, 광원 처리
- **비율과 형태**: 인체비율, 얼굴특징 크기/위치, 신체 비례, 데포르메 정도
- **디테일 렌더링**: 머리카락, 옷주름, 피부, 눈, 얼굴 단순화 방식
- **색상 팔레트**: 주조색, 색상 관계, 채도/명도 경향, 색조화 타입
- **시각적 질감**: 표면 처리, 브러시 터치, 재질 표현, 마감 품질
- **스타일 분류**: 기존 스타일과의 유사성 (애니메이션, 만화, 리얼 등)

## 라이선스

MIT License

## 기여하기

이슈 리포트와 풀 리퀘스트를 환영합니다.
