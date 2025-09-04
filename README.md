# Copy Drawing Style

**AI 아트 생성 도구 최적화된 전문 그림 스타일 분석 시스템**

이미지를 업로드하면 AI가 전문적으로 분석하여 **Stable Diffusion, Midjourney, DALL-E** 등에서 즉시 사용 가능한 최적화된 프롬프트를 생성합니다.

## 🎯 핵심 기능

### ✨ AI 아트 생성 특화 분석
- **개별 이미지 분석**: 각 이미지를 독립적으로 전문 분석
- **통합 스타일 합성**: 여러 이미지의 공통 스타일 요소 추출
- **AI 모델 최적화**: Stable Diffusion 등에 최적화된 키워드 생성

### 🛠️ 전문적인 결과 제공
- **마스터 프롬프트**: 바로 사용 가능한 메인 생성 프롬프트
- **네거티브 프롬프트**: 원하지 않는 요소 제거용
- **기술적 매개변수**: CFG Scale, Steps, Sampling 방법 추천
- **가중치 최적화**: 스타일 요소별 가중치 제안

### 💡 사용자 경험 
- 최대 20개 이미지 동시 업로드
- 직관적인 탭 기반 결과 표시
- 원클릭 프롬프트 복사
- 실시간 분석 진행 상황 표시

## 🎨 분석 기술 스팩

**LINE ART 기술 분석:**
- Line weight control, pressure patterns, edge treatment
- Vector vs hand-drawn vs digital line classification

**RENDERING 분류:**  
- Cel-shading, gradient painting, vector art identification
- Color palette harmony and saturation analysis

**LIGHTING 시스템:**
- Key light, rim lighting, shadow type detection  
- Atmospheric and volumetric lighting analysis

**PROPORTIONS & ANATOMY:**
- Figure ratios (realistic vs stylized vs chibi)
- Facial feature analysis and deformation levels

**STYLISTIC 분류:**
- Cultural influences (anime, western, manhwa)
- Era markers (90s, modern, retro)
- Medium simulation detection

## 🚀 기술 스택

- **프론트엔드**: HTML5, CSS3, Vanilla JavaScript
- **백엔드**: Cloudflare Pages Functions (Workers)  
- **AI 엔진**: Alibaba Cloud DashScope (Qwen-VL-Max-Latest)
- **최대 토큰**: 32,768 (초장문 분석 지원)

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
