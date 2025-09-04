# Copy Drawing Style

AI를 활용한 그림 스타일 완전 분석 도구입니다. 이미지를 업로드하면 상세한 스타일 분석을 통해 동일한 스타일의 그림을 그릴 수 있는 프롬프트를 생성합니다.

## 기능

- 이미지 드래그 앤 드롭 업로드 (최대 20개)
- 개별 이미지 정밀 분석 후 종합 분석
- **AI 아트 생성 최적화된** 전문 스타일 분석
- **실제 사용 가능한** 프롬프트 생성 (Stable Diffusion, Midjourney 등)
- 가중치 및 네거티브 프롬프트 추천
- 개별 분석 결과 상세 보기
- 원클릭 클립보드 복사

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

## 🎨 전문 분석 요소

### **LINE ART TECHNICAL ANALYSIS**
- 선 굵기 제어 (uniform/variable/pressure-sensitive)
- 선 품질 (vector/sketchy/digital/organic brush)
- 윤곽선 처리 (thick outlines/thin/no outlines/colored outlines)

### **RENDERING STYLE CLASSIFICATION** 
- 주요 기법 (cel-shading/painting/vector/traditional media simulation)
- 셰이딩 방법 (toon shading/gradient/realistic lighting)
- 색상 적용 (flat colors/gradients/textured brushing)

### **COLOR PALETTE AND THEORY**
- 팔레트 타입 (monochromatic/complementary/triadic)
- 채도 수준 (desaturated/medium/highly saturated)
- 색온도 (warm/cool/balanced)

### **LIGHTING AND DIMENSIONAL RENDERING**
- 광원 타입 (single/multiple/ambient/rim lighting)
- 하이라이트 처리 (sharp specular/soft/rim light/flat)
- 대기 효과 (depth haze/light rays/particles)

### **CHARACTER DESIGN PROPORTIONS**
- 두신비 (realistic 7-8/stylized 6-7/chibi 4-5)
- 얼굴 특징 (large eyes/realistic/caricature)

### **STYLISTIC GENRE IDENTIFICATION**
- 문화적 스타일 (Western cartoon/anime/manhwa/European comic)
- 시대/운동 영향 (modern digital/90s anime/retro/classical)

## 라이선스

MIT License

## 기여하기

이슈 리포트와 풀 리퀘스트를 환영합니다.
