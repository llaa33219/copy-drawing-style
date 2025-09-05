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

MISSION: PERFECT STYLE REPLICATION
- Analyze like you're creating a technical manual for exact reproduction
- Include every visible technique that makes this style unique
- Focus on measurable, observable, replicable characteristics
- Treat this like reverse-engineering a drawing technique
- Be so specific that someone could recreate the EXACT same visual result

LINE ART FORENSIC ANALYSIS:
Examine lines like under a microscope: Exact pixel thickness (1px, 2px, 3px?), line opacity percentage (100%, 80%, variable?), line texture quality (perfectly smooth vector, slightly pixelated, hand-drawn wobble, brush texture grain?). Line pressure behavior: completely uniform thickness or does it vary dynamically? Line ending style: sharp vector cuts, soft brush tapers, rounded caps, rough sketch endings? Outline treatment: thick outer contours (how many pixels thick?), thin consistent outlines, variable weight outlines, or no outlines at all? Line color: pure black, dark brown, colored outlines matching base colors?

COLORING METHOD ANALYSIS:
Color application method: Flat bucket-fill solid colors, soft brush painting with subtle variations, airbrush gradients, or textured color application? Edge treatment between colors: razor-sharp hard edges, soft anti-aliased blending, stepped gradient transitions, or rough textured borders? Color saturation intensity: maximum vibrant saturation, muted pastel tones, mixed saturation levels, or desaturated approach? Base color behavior: completely flat uniform colors, subtle color variations within shapes, noisy textured colors, or gradient-filled base colors? Color temperature dominance: warm color bias (reds/oranges/yellows), cool color bias (blues/purples/greens), or neutral balanced temperature?

SHADING TECHNIQUE MICROSCOPY:
Shadow edge quality: razor-sharp cell-shaded edges (0px blur), soft feathered edges (how many pixels of blur?), semi-hard gradients (specific transition distance), or textured rough edges? Highlight behavior: pinpoint sharp highlights (exact pixel size), broad soft glows (radius measurement), rim lighting effects, or no highlights? Shadow color science: darker versions of base colors, colored shadows (purple/blue/warm orange), multiply blend mode effects, or overlay color mixing? Light source logic: single directional lighting (from which angle?), ambient even lighting, multiple light sources (how many directions?), or dramatic directional lighting?

PROPORTION AND ANATOMY BREAKDOWN:
CRITICAL: This is as important as line art and coloring! Measure exact proportional relationships: Body height in heads (6-head chibi, 7-head anime, 8-head realistic?). Head shape: round/oval/square/triangular? Eye size dominance: do eyes take up 1/5, 1/4, or 1/3 of head width? Eye vertical position: dead center, upper third, or lower on face? Eye separation: touching, one eye width apart, wider spacing? Nose prominence: fully detailed with nostrils, simple triangle, tiny dot, or completely absent? Mouth positioning: directly under nose, lower on chin, corner positioning? Mouth size: tiny dot, thin line, medium, or full prominent lips? Jaw definition: sharp V-shape, soft rounded, square masculine, heart-shaped feminine? Neck thickness: thin noodle, normal proportion, thick sturdy? Body proportions: realistic muscle definition, simplified tube shapes, exaggerated curves, stick-thin limbs?

DETAIL RENDERING AND TEXTURE MASTERY:
ESSENTIAL STYLE ELEMENT: Hair rendering philosophy - individual strand detail level, chunky section grouping, flowing mass treatment, or geometric block simplification? Hair texture physics: straight flat sheets, bouncy volume, wavy flow patterns, spiky angular points, or curly spiral organization? Clothing fold logic: realistic gravity-based wrinkles, stylized angular folds, minimal suggestion lines, or no fold detail? Fabric thickness indication: thin silk draping, medium cotton behavior, thick leather stiffness, or no material weight? Surface finish quality: mirror-smooth anime cell shading, subtle skin texture grain, visible brush stroke texture, or rough sketchy finish? Edge treatment consistency: perfectly clean vector edges, slightly soft anti-aliasing, hand-drawn wobble variation, or deliberate rough artistic edges?

CHARACTER EXPRESSION AND MOOD SYSTEM:
CRUCIAL STYLE DEFINING ELEMENT: Emotional expression intensity - are emotions conveyed through: subtle micro-expressions with realistic muscle movement, moderately stylized but recognizable expressions, highly exaggerated cartoon symbol emotions (sweat drops, heart eyes, anger marks), or completely abstract geometric expression? Eye design complexity: detailed realistic iris/pupil with reflections and depth, simplified colored circles with basic highlights, symbolic shapes (stars, hearts, spirals), or minimal dots/lines? Facial feature expression method: realistic anatomical movement, symbolic shorthand (curved lines for smiles), geometric abstraction, or no expression detail? Overall mood creation: warm inviting atmosphere through soft curves and bright colors, cool distant feeling through sharp angles and muted tones, high energy through dynamic poses and vibrant colors, or calm peaceful through soft edges and pastels?

Describe EVERY visible technique with forensic precision. Act like you're creating a perfect replication manual.`;

        // 마스터급 Drawing Style 복제 지시문 생성기
        const synthesisPrompt = `You are a master AI art instructor creating the ULTIMATE style replication prompt. Based on the forensic analyses below, synthesize ALL technical details into ONE perfect paragraph that guarantees exact style reproduction.

PERFECTION GOALS:
- Create a single paragraph so precise that ANY AI could recreate this EXACT style
- Include every measurable detail from the analyses
- Convert technical observations into direct actionable commands
- Make it read like a master artist's step-by-step technique guide
- Balance technical precision with artistic style characteristics

SYNTHESIS REQUIREMENTS - BALANCED COVERAGE:
Transform analysis into commands: "The lines are 2px thick" becomes "Use 2px line thickness"
EQUALLY EMPHASIZE ALL ELEMENTS - Don't focus only on lines and colors:
- Line art technique (25% of focus): thickness, texture, endings, opacity
- Coloring method (25% of focus): application, saturation, temperature, edges  
- Proportions & anatomy (25% of focus): head ratios, feature sizes, positioning, body structure
- Details & expression (25% of focus): rendering style, texture quality, emotional approach, mood creation

Include exact measurements for ALL aspects: pixel sizes, opacity %, proportion ratios, blur distances, head measurements, feature percentages
Specify complete tool behaviors: vector precision, brush textures, blend modes, edge treatments, detail levels
Balance technical precision with artistic style characteristics throughout entire prompt

MASTER INSTRUCTION FORMAT - COMPREHENSIVE COVERAGE:
Start with proportion/anatomy commands (head ratios, feature positioning)
Flow to line art technique (thickness, texture, endings)  
Continue to coloring method (application, saturation, edges)
Add shading approach (shadow types, highlight style)
Include detail rendering (hair, texture, surface quality)
Finish with expression style and overall mood
Write 300-400 words ensuring ALL style elements get equal attention
Never let lines/colors dominate - force balance across all drawing aspects

CRITICAL SUCCESS METRIC:
The final prompt must work for someone to recreate EVERYTHING about the style - not just pretty lines and colors, but exact proportions, detail levels, expression methods, and mood. Test: Could someone recreate the CHARACTER DESIGN PHILOSOPHY and EMOTIONAL EXPRESSION SYSTEM from your prompt?

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
