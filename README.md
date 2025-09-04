# Copy Drawing Style

최신 AI 이미지 생성 기술을 활용한 그림 스타일 완전 분석 도구입니다. 이미지를 업로드하면 최신 AI 모델(GPT-4o, FLUX, Midjourney v7, Claude 3.5)에 최적화된 자연어 스타일 프롬프트를 생성합니다.

## 기능

- 이미지 드래그 앤 드롭 업로드 (최대 20개)
- 개별 이미지 분석 후 종합 분석
- 최신 AI 모델 최적화된 자연어 스타일 분석
- 예술적 감성과 기술적 특징을 모두 담은 프롬프트 생성
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

## 🚀 2025년 최신 AI 최적화 분석 프로세스

1. **예술적 감성 분석**: 각 이미지의 감정적 본질과 예술적 의도 파악
2. **자연어 스타일 서술**: 최신 AI 모델이 이해하기 쉬운 서정적이고 풍부한 언어로 분석
3. **통합 마스터 프롬프트**: 모든 분석을 종합하여 단일한 완벽한 자연어 스타일 설명 생성
4. **직접 사용 가능**: GPT-4o, FLUX, Midjourney v7, Claude 3.5 등에 바로 입력 가능

## 사용법

1. 웹사이트 접속
2. 분석하고 싶은 그림 이미지 업로드 (드래그 앤 드롭, 최대 20개)
3. "스타일 분석 시작" 버튼 클릭
4. AI가 생성한 자연어 스타일 프롬프트를 복사하여 최신 AI 이미지 생성 도구에 사용

## 분석 요소 (2025년 최신 AI 모델 기준)

- **예술적 본질**: 작품의 감정적 분위기와 예술적 철학
- **시각적 스토리텔링**: 구성 요소와 시선 유도 방식
- **선 작업의 개성**: 선의 감정적 특성과 표현력
- **색채 철학**: 색상이 전달하는 이야기와 감정
- **조명 내러티브**: 빛의 행동과 분위기 연출
- **표면 질감**: 재질감을 시각적으로 전달하는 방식
- **비례 미학**: 비율 선택에 담긴 예술적 의도
- **문화적 유산**: 예술 사조와 문화적 영향
- **독특한 시그니처**: 이 스타일만의 고유한 특징

## 라이선스

MIT License

## 기여하기

이슈 리포트와 풀 리퀘스트를 환영합니다.
