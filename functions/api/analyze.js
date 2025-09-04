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

**CRITICAL: ANALYZE TECHNIQUE, NOT CONTENT**
- Do NOT mention characters, objects, or story elements
- Focus ONLY on the drawing method and visual technique  
- Describe HOW lines are drawn, NOT what they depict
- Analyze HOW colors are applied, NOT what colors represent
- Study HOW proportions work, NOT what body parts look like

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

Focus exclusively on replicable drawing techniques. Never describe content, characters, or narrative elements.`;

        // 순수 Drawing Style 지시문 생성 (캐릭터 묘사 금지)
        const synthesisPrompt = `You are creating a pure drawing technique prompt for AI image generation. Based on the technical analyses below, write ONE paragraph of drawing style commands that focus ONLY on HOW to draw, never WHAT to draw.

**ABSOLUTE RESTRICTIONS:**
- NEVER mention specific characters, people, objects, or content
- NEVER describe what should be drawn (no "girl", "boy", "hair color", "clothing", etc.)
- Focus ONLY on drawing technique and visual style methodology
- Write pure technical drawing instructions

**CORRECT APPROACH:**
Instead of: "Draw a character with long blonde hair wearing a red dress..."
Write: "Use 7-head proportions, apply thin line art with 2px thickness, render with cell-shaded coloring..."

Instead of: "Create a smiling girl with large eyes..."  
Write: "Position facial features with oversized eye proportions, use simple line-based mouth rendering..."

**TECHNIQUE-ONLY REQUIREMENTS:**
- Start with drawing method commands: "Use... Apply... Render... Draw with..."
- Include line art technique, coloring method, shading approach, proportion system
- Specify technical measurements and digital tool behaviors  
- Cover edge quality, color application, highlight/shadow treatment
- Focus on replicable visual techniques, never content description
- Write as one flowing paragraph of pure drawing style methodology
- 200-300 words of technical drawing instructions only

**CRITICAL OUTPUT:**
Write only drawing technique commands. No character descriptions, no content mentions, no object references. Pure drawing methodology only.

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
