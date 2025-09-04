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

        // 개별 이미지 분석을 위한 전문적인 영어 프롬프트
        const individualAnalysisPrompt = `Analyze this artwork/illustration with extreme precision to create an AI-art-generation-ready style analysis. Focus on elements that directly translate to effective prompts:

**LINE ART TECHNICAL ANALYSIS:**
- Line weight control: uniform thickness, variable line weight, or pressure-sensitive strokes
- Line quality descriptors: clean vector lines, hand-drawn sketchy lines, precise digital lines, organic brush strokes
- Line termination: sharp endings, rounded caps, tapered brush ends, or rough sketch marks
- Outline treatment: thick black outlines (cel-shading style), thin precise lines, no outlines (painterly), or colored outlines
- Line confidence: confident single strokes vs tentative multiple strokes vs constructed geometric lines

**RENDERING STYLE CLASSIFICATION:**
- Primary technique: flat cel-shading, soft painting style, hard-edge vector art, traditional media simulation, or hybrid approach
- Shading method: cell/toon shading with distinct color zones, gradient painting with soft transitions, or realistic light rendering
- Color application: solid flat colors, gradient fills, textured brush painting, airbrush effects, or watercolor bleeding
- Detail level: minimalist/simplified, moderate detail, or highly detailed/realistic approach

**COLOR PALETTE AND THEORY:**
- Palette type: monochromatic, analogous, complementary, triadic, or rainbow spectrum
- Saturation level: desaturated/muted tones, medium saturation, or highly saturated/vibrant colors
- Value contrast: high contrast with deep shadows, medium contrast, or low contrast/flat lighting
- Color temperature: warm-biased, cool-biased, or balanced temperature palette
- Special color effects: neon/glowing colors, pastel softness, earth tones, or metallic/iridescent effects

**LIGHTING AND DIMENSIONAL RENDERING:**
- Light source type: single directional light, multiple light sources, ambient flat lighting, or dramatic rim lighting
- Shadow characteristics: hard-edged shadows, soft gradient shadows, cast shadows present/absent, or stylized shadow shapes
- Highlight treatment: sharp specular highlights, soft diffuse highlights, rim light effects, or no highlights (flat style)
- Subsurface effects: skin translucency, fabric light transmission, or solid opaque rendering
- Atmospheric effects: depth haze, light rays, particle effects, or clear/flat atmosphere

**CHARACTER DESIGN PROPORTIONS:**
- Head-to-body ratio: realistic 7-8 heads, stylized 6-7 heads, or exaggerated 4-5 heads (chibi/cute style)
- Facial feature proportions: large eyes (anime style), realistic proportions, or stylized/caricature features  
- Body type rendering: anatomically accurate, stylized/idealized, or simplified/geometric shapes
- Age representation: child-like features, teenager proportions, adult anatomy, or elderly characteristics

**TEXTURE AND SURFACE QUALITY:**
- Skin rendering: smooth/polished, soft/painted, textured/realistic, or simplified flat
- Hair technique: individual strand detail, chunky/grouped sections, flat color shapes, or painterly masses
- Fabric representation: detailed folds and creases, simplified geometric folds, or flat graphic shapes
- Material indication: glossy/reflective surfaces, matte/diffuse materials, or stylized material representation

**STYLISTIC GENRE IDENTIFICATION:**
- Cultural style markers: Western cartoon/animation, Japanese anime/manga, Korean manhwa, European comic, or traditional art influence
- Era/movement influence: modern digital art, 90s anime style, retro poster art, classical painting techniques, or contemporary illustration trends
- Medium simulation: digital painting, traditional watercolor, oil painting, pencil sketch, or vector graphics appearance

Provide specific, actionable style descriptors that would work effectively in AI art generation prompts. Use precise technical terminology that AI models recognize for style control.`;

        // 종합 분석을 위한 AI 아트 생성 최적화 프롬프트
        const synthesisPrompt = `You are an expert AI art prompt engineer. Based on the following individual style analyses, create the most effective and precise prompt for AI image generation tools (Stable Diffusion, Midjourney, etc.) that will reproduce this exact art style.

**SYNTHESIS REQUIREMENTS:**
1. Identify the most consistent and defining style elements across all analyses
2. Translate technical art terms into AI-prompt-friendly keywords that models recognize
3. Structure the prompt for maximum effectiveness with modern AI art generators
4. Include both positive descriptors and implied negative space (what to avoid)
5. Balance specificity with flexibility for different subjects

**OUTPUT FORMAT:**
Create a production-ready prompt in this optimized structure:

**MAIN STYLE PROMPT:**
"[Primary art medium/technique], [line art style], [coloring method], [lighting approach], [character proportions], [detail level], [cultural/genre influence], [color palette], [special visual effects], [overall mood/atmosphere]"

**TECHNICAL MODIFIERS:**
- Aspect ratio recommendations
- Suggested CFG scale range
- Key negative prompts to avoid unwanted elements
- Additional style-specific keywords for fine-tuning

**WEIGHT SUGGESTIONS:**
- Which elements should be emphasized with increased weights (1.2-1.4)
- Which elements might need de-emphasis (0.8-0.9)

**ALTERNATIVE PHRASINGS:**
- 2-3 alternative ways to describe the core style for testing variations
- Style-specific keywords that work well with this particular art approach

Focus on creating a prompt that will consistently generate images in the analyzed style across different subjects and compositions. Use terminology that AI models have strong associations with in their training data.

Individual style analyses:`;

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
