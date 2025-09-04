export async function onRequestPost(context) {
    const { request, env } = context;
    
    try {
        const { images } = await request.json();
        
        if (!images || images.length === 0) {
            return Response.json({ error: '이미지가 없습니다.' }, { status: 400 });
        }

        // 이미지 개수 제한 (20개)
        if (images.length > 20) {
            return Response.json({ error: '이미지는 최대 20개까지 업로드 가능합니다.' }, { status: 400 });
        }

        // DashScope API 키 확인
        if (!env.DASHSCOPE_API_KEY) {
            return Response.json({ error: 'API 키가 설정되지 않았습니다.' }, { status: 500 });
        }

        // 순수 Drawing Style 기법 추출 프롬프트  
        const individualAnalysisPrompt = `You are analyzing ONLY the drawing technique and style, NOT the character or content. Ignore what is drawn and focus entirely on HOW it's drawn. Extract pure visual technique characteristics.

**CRITICAL: ANALYZE TECHNIQUE AND STYLE FEEL**
- Focus on drawing method and visual technique
- Include character expression style and emotional rendering approach
- Describe HOW lines are drawn and their stylistic feel
- Analyze HOW colors create mood and atmosphere  
- Study proportional systems and their stylistic impact
- Avoid specific content details but include style characteristics

**LINE ART TECHNIQUE ANALYSIS:**
- Line weight behavior: uniform thickness vs variable pressure
- Line quality: smooth vector lines vs organic brush strokes vs pencil texture
- Line ending treatment: sharp cuts vs soft tapers vs rounded caps  
- Outline methodology: thick borders vs thin outlines vs no outlines
- Line opacity patterns: solid 100% vs semi-transparent effects
- Line texture approach: clean digital vs textured traditional media simulation

**COLORING METHOD ANALYSIS:**
- Base color application: flat bucket fills vs brush painting vs gradient fills
- Color transition technique: hard edges vs smooth blending vs stepped gradients
- Saturation approach: high intensity vs muted tones vs mixed saturation levels
- Color mixing method: pure flat colors vs subtle color variations vs textured color noise
- Temperature bias: warm color dominance vs cool color preference vs neutral balance

**SHADING TECHNIQUE ANALYSIS:**  
- Shadow edge treatment: razor-sharp cell shading vs soft airbrush vs semi-hard gradients
- Highlight application: pinpoint sharp highlights vs broad soft glows vs no highlights
- Shadow color method: darker base colors vs colored shadows (purple/blue) vs warm shadows
- Lighting logic: single directional light vs ambient lighting vs multiple light sources
- Shadow density: solid opaque vs semi-transparent overlays vs gradient transparency

**PROPORTION SYSTEM ANALYSIS:**
- Head-to-body measurement system: realistic 8-head vs stylized 6-head vs chibi 3-head proportions
- Facial feature sizing: large eyes vs small eyes, nose prominence, mouth size relative to face
- Feature positioning: eye placement height, nose-to-mouth distance, jaw line treatment
- Body structure approach: realistic anatomy vs stylized simplification vs exaggerated proportions

**RENDERING TECHNIQUE ANALYSIS:**
- Detail level consistency: highly detailed vs simplified vs mixed detail levels
- Texture simulation methods: hair rendering technique, fabric fold treatment, surface quality representation
- Edge quality standards: clean sharp edges vs soft blurred edges vs textured rough edges
- Digital tool evidence: vector graphics precision vs raster painting effects vs traditional media simulation

**EXPRESSION STYLE ANALYSIS:**
- Emotional rendering approach: how emotions are conveyed through line work and shading
- Facial expression methodology: subtle vs exaggerated, realistic vs stylized
- Character design philosophy: cute/moe vs cool/serious vs dramatic vs playful style
- Artistic mood creation: warm and friendly vs cool and distant vs dynamic vs calm
- Style genre characteristics: anime, cartoon, realistic, semi-realistic, chibi, etc.

Focus on replicable drawing techniques AND the artistic style feel. Include expression methods and mood creation techniques.`;

        // Drawing Style 지시문 생성 (기법 + 스타일 느낌 포함)
        const synthesisPrompt = `You are creating a comprehensive drawing style prompt for AI image generation. Based on the technical analyses below, write ONE paragraph that combines drawing techniques with artistic style characteristics.

**BALANCED APPROACH:**
- Include drawing technique AND artistic style feel
- Avoid specific character details but include expression style
- Focus on HOW to achieve the artistic mood and character expression approach
- Combine technical specifications with stylistic characteristics

**AVOID SPECIFIC CONTENT:**
- Don't mention: "blonde hair", "red dress", "blue eyes", specific clothing
- Don't describe: particular characters, specific objects, story elements

**INCLUDE STYLE CHARACTERISTICS:**  
- Expression methodology: "cute/moe style", "serious tone", "playful character expression"
- Artistic mood: "warm friendly atmosphere", "cool dramatic feel", "soft gentle rendering"
- Style genre: "anime-style", "cartoon approach", "realistic technique", "chibi methodology"
- Emotional rendering: "exaggerated expressions", "subtle emotion conveyance", "dramatic facial rendering"

**TECHNIQUE + STYLE REQUIREMENTS:**
- Start with drawing method: "Use... Apply... Render... Draw with..."
- Include: line art technique, coloring method, shading approach, proportion system
- Add: artistic style feel, expression methodology, mood creation technique
- Specify: technical measurements, digital tool behaviors, style characteristics
- Write as one flowing paragraph combining technique and artistic approach
- 200-300 words mixing technical drawing instructions with style feel

**BALANCED OUTPUT:**
Combine pure drawing techniques with artistic style characteristics. Include both HOW to draw technically and HOW to achieve the artistic style and expression feel.

Individual technical analyses:`;

        let individualAnalyses = [];

        // 각 이미지를 개별적으로 분석
        for (let i = 0; i < images.length; i++) {
            try {
                const messages = [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: individualAnalysisPrompt
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: images[i]
                                }
                            }
                        ]
                    }
                ];

                const response = await fetch('https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${env.DASHSCOPE_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: 'qwen-vl-max-latest',
                        messages: messages,
                        max_tokens: 32768,
                        temperature: 0.7
                    })
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.choices && result.choices.length > 0) {
                        individualAnalyses.push(`Analysis ${i + 1}:\n${result.choices[0].message.content}`);
                    }
                }
            } catch (error) {
                console.error(`이미지 ${i + 1} 분석 중 오류:`, error);
            }
        }

        // 개별 분석 결과가 없으면 에러 반환
        if (individualAnalyses.length === 0) {
            return Response.json({ error: '이미지 분석에 실패했습니다.' }, { status: 500 });
        }

        // 모든 분석 결과를 종합하여 최종 프롬프트 생성
        const synthesisMessages = [
            {
                role: "user",
                content: [
                    {
                        type: "text",
                        text: synthesisPrompt + "\n\n" + individualAnalyses.join("\n\n")
                    }
                ]
            }
        ];

        const synthesisResponse = await fetch('https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${env.DASHSCOPE_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'qwen-vl-max-latest',
                messages: synthesisMessages,
                max_tokens: 32768,
                temperature: 0.7
            })
        });

        if (!synthesisResponse.ok) {
            const errorText = await synthesisResponse.text();
            console.error('종합 분석 API 오류:', errorText);
            return Response.json({ 
                error: `종합 분석 API 호출 실패: ${synthesisResponse.status}`,
                details: errorText
            }, { status: synthesisResponse.status });
        }

        const synthesisResult = await synthesisResponse.json();
        
        if (!synthesisResult.choices || synthesisResult.choices.length === 0) {
            return Response.json({ error: '종합 분석 결과가 비어있습니다.' }, { status: 500 });
        }

        const finalPrompt = synthesisResult.choices[0].message.content;

        return Response.json({ 
            prompt: finalPrompt,
            individualAnalyses: individualAnalyses,
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
