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

        // 극정밀 Drawing Style 복사 분석 시스템  
        const individualAnalysisPrompt = `You are a master drawing style analyst creating an EXACT visual blueprint for perfect style replication. Act like a forensic art analyst examining every microscopic detail.

**MISSION: PERFECT STYLE REPLICATION**
- Analyze like you're creating a technical manual for exact reproduction
- Include every visible technique that makes this style unique
- Focus on measurable, observable, replicable characteristics
- Treat this like reverse-engineering a drawing technique
- Be so specific that someone could recreate the EXACT same visual result`;

**ULTRA-PRECISE LINE ART FORENSICS:**
Examine lines like under a microscope: Exact pixel thickness (1px, 2px, 3px?), line opacity percentage (100%, 80%, variable?), line texture quality (perfectly smooth vector, slightly pixelated, hand-drawn wobble, brush texture grain?). Line pressure behavior: completely uniform thickness or does it vary dynamically? Line ending style: sharp vector cuts, soft brush tapers, rounded caps, rough sketch endings? Outline treatment: thick outer contours (how many pixels thick?), thin consistent outlines, variable weight outlines, or no outlines at all? Line color: pure black, dark brown, colored outlines matching base colors?

**MICROSCOPIC COLORING ANALYSIS:**
Color application method: Flat bucket-fill solid colors, soft brush painting with subtle variations, airbrush gradients, or textured color application? Edge treatment between colors: razor-sharp hard edges, soft anti-aliased blending, stepped gradient transitions, or rough textured borders? Color saturation intensity: maximum vibrant saturation, muted pastel tones, mixed saturation levels, or desaturated approach? Base color behavior: completely flat uniform colors, subtle color variations within shapes, noisy textured colors, or gradient-filled base colors? Color temperature dominance: warm color bias (reds/oranges/yellows), cool color bias (blues/purples/greens), or neutral balanced temperature?

**PRECISION SHADING MICROSCOPY:**
Shadow edge quality: razor-sharp cell-shaded edges (0px blur), soft feathered edges (how many pixels of blur?), semi-hard gradients (specific transition distance), or textured rough edges? Highlight behavior: pinpoint sharp highlights (exact pixel size), broad soft glows (radius measurement), rim lighting effects, or no highlights? Shadow color science: darker versions of base colors, colored shadows (purple/blue/warm orange), multiply blend mode effects, or overlay color mixing? Light source logic: single directional lighting (from which angle?), ambient even lighting, multiple light sources (how many directions?), or dramatic directional lighting?

**ANATOMICAL PROPORTION SCIENCE:**
Exact measurement ratios: How many heads tall is the body? (6, 7, 8 heads?) Eye size relative to head width (1/5, 1/4, 1/3 of head width?). Eye positioning: centered on face middle, above center line, or below? Inter-eye distance: one eye width apart, closer, or wider? Nose treatment: detailed realistic rendering, simple line indication, small dot, or absent? Mouth size and positioning: small delicate (what percentage of face width?), full lips, simple line, or dot indication? Jaw shape specifics: sharp angular, soft rounded, square masculine, or pointed feminine? Body proportion style: realistic anatomy ratios, stylized elongation, shortened proportions, or exaggerated features?

**MICRO-DETAIL RENDERING FORENSICS:**
Hair strand organization: Individual detailed strands, chunky grouped sections, flowing ribbon-like masses, or simplified shape blocks? Hair texture simulation: straight smooth surfaces, wavy undulation, curly spiral patterns, or spiky angular shapes? Surface quality evidence: perfectly smooth flat surfaces, subtle texture grain, visible brush strokes, or rough textured finish? Edge detail treatment: clean precise edges, soft slightly blurred edges, rough hand-drawn edges, or textured artistic edges?

**EMOTIONAL EXPRESSION BLUEPRINT:**
Expression intensity scale: subtle realistic emotions, moderately stylized expressions, highly exaggerated cartoon emotions, or minimal expression approach? Facial expression methodology: detailed realistic muscle movement, simplified symbolic expression, geometric shape-based emotions, or abstract expression approach? Eye expression system: detailed iris/pupil rendering, simple dot eyes, symbolic shape eyes (circles, stars), or complex emotional eye design? Artistic mood creation technique: warm friendly visual temperature, cool distant atmosphere, high energy dynamic feel, or calm peaceful mood?

Describe EVERY visible technique with forensic precision. Act like you're creating a perfect replication manual.`;

        // 마스터급 Drawing Style 복제 지시문 생성기
        const synthesisPrompt = `You are a master AI art instructor creating the ULTIMATE style replication prompt. Based on the forensic analyses below, synthesize ALL technical details into ONE perfect paragraph that guarantees exact style reproduction.

**PERFECTION GOALS:**
- Create a single paragraph so precise that ANY AI could recreate this EXACT style
- Include every measurable detail from the analyses
- Convert technical observations into direct actionable commands
- Make it read like a master artist's step-by-step technique guide
- Balance technical precision with artistic style characteristics

**SYNTHESIS REQUIREMENTS:**
Transform analysis into commands: "The lines are 2px thick" becomes "Use 2px line thickness"
Include exact measurements: pixel sizes, opacity percentages, proportion ratios, blur distances
Specify tool behaviors: vector precision, brush textures, blend modes, edge treatments
Add style feel: emotional expression approach, mood creation, artistic atmosphere
Combine all elements: line art + coloring + shading + proportions + details + expression + mood

**MASTER INSTRUCTION FORMAT:**
Start immediately with drawing commands using imperative mood
Flow naturally from technique to technique without section breaks
Include specific numbers, percentages, and measurements throughout
Mention artistic style characteristics and emotional expression methods
End with overall artistic mood and style genre classification
Write 250-350 words of pure technical artistry instruction

**ULTIMATE OUTPUT GOAL:**
Create the most comprehensive, precise, actionable drawing style instruction ever written. Someone should be able to follow this paragraph and produce visually identical artwork.

Individual forensic analyses:`;

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
