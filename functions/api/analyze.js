export async function onRequestPost(context) {
    const { request, env } = context;
    
    try {
        const { images } = await request.json();
        
        if (!images || images.length === 0) {
            return Response.json({ error: '이미지가 없습니다.' }, { status: 400 });
        }

        // DashScope API 키 확인
        if (!env.DASHSCOPE_API_KEY) {
            return Response.json({ error: 'API 키가 설정되지 않았습니다.' }, { status: 500 });
        }

        // 그림 스타일 분석을 위한 상세한 프롬프트
        const analysisPrompt = `다음 이미지들의 그림 스타일을 매우 상세하게 분석하여 완전히 똑같은 스타일로 그림을 그릴 수 있도록 프롬프트를 만들어주세요.

분석해야 할 요소들:

**선화 (Line Art)**
- 선의 굵기와 강약 조절 방식 (균일한지, 다양한지)
- 펜 압력 사용 패턴 (부드러운지, 강한지)
- 선의 끝처리 방식 (뾰족한지, 둥근지, 테이퍼 처리)
- 스케치의 러프함 정도 (깔끔한지, 거친지)
- 클린업 스타일과 정교함 정도

**형태와 비율**
- 인체 비율 (몇 등신인지, 어떤 부분이 과장되었는지)
- 얼굴 비율과 특징 (눈 크기, 코 형태, 입 위치, 턱선)
- 손발의 표현 정도와 단순화 수준
- 데포르메 정도와 특별히 과장된 부분들
- 전체적인 인체 표현 스타일

**렌더링 기법과 채색**
- 셀 셰이딩 vs 페인팅 스타일 vs 혼합형
- 주요 색상 팔레트와 색조 특징
- 그라데이션 사용 여부와 방식 (부드러운지, 단계적인지)
- 하이라이트와 림라이트 처리 방법
- 색상의 채도와 명도 경향

**음영과 조명 표현**
- 광원 설정 방식 (단일 광원, 다중 광원, 환경광)
- 그림자의 경계 처리 (하드 섀도우, 소프트 섀도우)
- 반사광과 바운스 라이트 사용 정도
- 앰비언트 오클루전 표현 방식
- 볼륨과 형태감 표현 방법

**세부 표현과 질감**
- 머리카락 표현 방식 (뭉치감, 가닥 디테일, 질감)
- 옷 주름과 패브릭의 표현 패턴
- 피부 질감 처리 (매끄러운지, 거친지, 디테일 정도)
- 특수 효과 (광택, 투명도, 반사 등)
- 액세서리와 소품 렌더링 스타일

**스타일 시그니처**
- 특유의 눈동자와 눈썹 표현
- 코와 입의 간략화 또는 강조 방식
- 손가락과 관절 표현의 특징
- 배경 처리 스타일 (단순한지, 상세한지)
- 캐릭터와 배경의 관계성

**기술적 세부사항**
- 사용된 브러시 종류와 텍스처 효과
- 블렌딩 모드와 레이어 구성 방식 추정
- 후처리 효과 (색상 보정, 필터 효과)
- 노이즈나 텍스처 오버레이 사용
- 전체적인 작업 프로세스 추정

**아트 스타일 분류**
- 전통적인 아트 스타일 참조 (만화, 애니메이션, 게임 아트 등)
- 특정 작가나 스튜디오 스타일과의 유사성
- 문화적/지역적 아트 스타일 특징
- 시대적 트렌드 반영 정도

이 모든 요소들을 종합하여, 동일한 스타일의 새로운 그림을 그릴 수 있도록 구체적이고 실행 가능한 프롬프트를 작성해주세요. 프롬프트는 다른 AI 아트 생성 도구나 아티스트가 바로 사용할 수 있을 정도로 명확하고 상세해야 합니다.

**프롬프트 형식:**
"[스타일 설명], [선화 특징], [채색 방식], [음영 처리], [비율과 형태], [세부 디테일], [특수 효과], [전체적 분위기]"

분석할 이미지:`;

        // DashScope API에 전송할 메시지 구성
        const messages = [
            {
                role: "user",
                content: [
                    {
                        type: "text",
                        text: analysisPrompt
                    },
                    ...images.map(imageData => ({
                        type: "image_url",
                        image_url: {
                            url: imageData
                        }
                    }))
                ]
            }
        ];

        // DashScope API 호출
        const response = await fetch('https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${env.DASHSCOPE_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'qwen-vl-max-latest',
                messages: messages,
                max_tokens: 2000,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('DashScope API 오류:', errorText);
            return Response.json({ 
                error: `API 호출 실패: ${response.status}`,
                details: errorText
            }, { status: response.status });
        }

        const result = await response.json();
        
        if (!result.choices || result.choices.length === 0) {
            return Response.json({ error: 'AI 응답이 비어있습니다.' }, { status: 500 });
        }

        const prompt = result.choices[0].message.content;

        return Response.json({ 
            prompt: prompt,
            success: true 
        });

    } catch (error) {
        console.error('분석 중 오류:', error);
        return Response.json({ 
            error: '서버 오류가 발생했습니다.',
            details: error.message
        }, { status: 500 });
    }
}
