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

        // AI 아트 생성 최적화된 개별 이미지 스타일 분석 프롬프트
        const individualAnalysisPrompt = `You are an expert AI art prompt engineer analyzing this artwork for style replication in Stable Diffusion, Midjourney, and similar AI art generation tools. Extract ONLY the visual style characteristics that can be effectively reproduced by AI models.

**CRITICAL ANALYSIS FOCUS:**
Analyze this artwork using AI-art-generation terminology that models recognize and respond to effectively:

**LINE ART TECHNICAL SPECS:**
- Line weight control: "uniform line weight" | "variable line thickness" | "pressure-sensitive strokes" | "bold outlines (2-3px)" | "thin precise lines (0.5-1px)" | "no outlines"
- Line quality: "clean vector lines" | "hand-drawn sketchy lines" | "precise digital lines" | "organic brush strokes" | "rough sketch marks"
- Line treatment: "black outlines" | "colored outlines" | "soft line edges" | "sharp vector edges" | "painterly no-lines"

**RENDERING CLASSIFICATION:**
- Primary technique: "flat cel shading" | "soft gradient painting" | "hard-edge vector art" | "traditional media simulation" | "photo-realistic rendering"
- Shading method: "toon shading with sharp shadows" | "soft airbrushed gradients" | "realistic volumetric lighting" | "flat ambient lighting"
- Color application: "solid flat colors" | "smooth gradients" | "textured brush strokes" | "watercolor bleeding" | "digital paint effects"

**COLOR PALETTE ANALYSIS:**
- Palette type: "monochromatic scheme" | "warm color harmony" | "cool color harmony" | "complementary contrast" | "triadic colors" | "vibrant rainbow"
- Saturation: "desaturated muted tones" | "medium saturation" | "highly saturated vibrant" | "pastel soft colors" | "neon bright colors"
- Value contrast: "high contrast dramatic" | "medium contrast balanced" | "low contrast flat" | "soft atmospheric"
- Color temperature: "warm golden tones" | "cool blue tones" | "balanced neutral tones" | "split warm/cool lighting"

**LIGHTING SYSTEM:**
- Light setup: "single key light" | "three-point lighting" | "ambient flat lighting" | "dramatic rim lighting" | "natural outdoor lighting" | "studio lighting setup"
- Shadow type: "sharp cel-shaded shadows" | "soft gradient shadows" | "realistic cast shadows" | "stylized shape shadows" | "minimal shadow"
- Highlight treatment: "sharp specular highlights" | "soft diffuse highlights" | "rim light glow" | "no highlights flat"

**PROPORTIONS & ANATOMY:**
- Figure ratio: "realistic 7-8 heads tall" | "stylized 6 heads tall" | "chibi 4 heads tall" | "elongated fashion 9 heads"  
- Facial features: "large anime eyes" | "realistic proportions" | "simplified cartoon" | "exaggerated caricature"
- Body type: "anatomically correct" | "stylized idealized" | "simplified geometric" | "chibi proportions"

**TEXTURE & SURFACE QUALITY:**
- Skin rendering: "smooth cel-shaded skin" | "soft painted skin" | "realistic skin texture" | "flat matte skin"
- Hair technique: "chunky anime hair" | "detailed hair strands" | "simplified hair shapes" | "painterly hair masses"
- Fabric treatment: "sharp clothing folds" | "soft fabric draping" | "flat graphic shapes" | "detailed textile texture"

**STYLISTIC CLASSIFICATION:**
- Cultural influence: "Japanese anime style" | "Western cartoon style" | "Korean manhwa style" | "European comic art" | "American animation"
- Era markers: "90s anime aesthetic" | "modern digital art" | "retro vintage poster" | "contemporary illustration"
- Medium simulation: "digital painting" | "traditional watercolor" | "oil painting texture" | "pencil sketch" | "vector graphics"

**AI GENERATION TAGS:**
Extract the most effective style tags for AI art generation:
- Primary style keywords (maximum 5 most defining terms)
- Supporting technique modifiers
- Quality enhancement tags
- Specific artistic movement or influence
- Technical rendering specifications

PROVIDE ANALYSIS IN THIS FORMAT:
**PRIMARY STYLE:** [Main classification]
**LINE ART:** [Technical specifications]  
**COLORING:** [Method and palette]
**LIGHTING:** [Setup and treatment]
**PROPORTIONS:** [Figure and facial ratios]
**TEXTURE:** [Surface treatments]
**INFLUENCES:** [Cultural/temporal markers]
**AI TAGS:** [Optimized generation keywords]

Use only terminology that AI art models have strong training associations with.`;

        // AI 아트 생성 도구 최적화된 통합 프롬프트 생성
        const synthesisPrompt = `You are a master AI art prompt engineer. Based on the following individual style analyses, create the MOST EFFECTIVE prompt for AI art generation tools (Stable Diffusion, Midjourney, DALL-E) that will consistently reproduce this exact art style.

**SYNTHESIS MISSION:**
1. Identify the STRONGEST recurring style elements across all analyses
2. Convert technical art terms into AI-prompt-optimized keywords that models recognize
3. Structure the prompt for maximum effectiveness with modern AI art generators
4. Provide weighted suggestions and negative prompts
5. Create alternative phrasings for testing variations

**REQUIRED OUTPUT FORMAT:**

**MASTER PROMPT:**
Create the main generation prompt in this proven effective structure:
"[Primary medium/technique] (1.3), [specific line art style] (1.2), [color palette + rendering method] (1.1), [lighting approach], [character proportions], [cultural/genre influence], [detail level], masterpiece, best quality, high resolution"

**STYLE BREAKDOWN:**
- **Core Style Tags:** [5 most critical keywords that define this style]
- **Line Art:** [Specific line treatment keywords]
- **Coloring:** [Palette and rendering technique]  
- **Lighting:** [Light setup and shadow type]
- **Anatomy:** [Proportion and feature specifications]
- **Cultural Context:** [Genre/origin markers]
- **Quality Enhancers:** [Technical improvement tags]

**NEGATIVE PROMPT:**
"[elements to avoid], low quality, blurry, distorted anatomy, bad proportions, worst quality, low resolution, pixelated, artifacts"

**WEIGHT RECOMMENDATIONS:**
- Primary style elements: (1.2-1.4)  
- Supporting details: (1.0-1.1)
- Elements to reduce: (0.8-0.9)

**ALTERNATIVE VARIATIONS:**
Provide 3 alternative main prompt variations for testing:
1. **Detailed Version:** [More descriptive terms]
2. **Simplified Version:** [Core essentials only]  
3. **Enhanced Version:** [With additional quality modifiers]

**TECHNICAL PARAMETERS:**
- Recommended CFG Scale: [7-15 range]
- Suggested Steps: [20-50 range]  
- Best Sampling Method: [DPM++ 2M Karras | Euler a | DDIM]

**LORA/EMBEDDING SUGGESTIONS:**
If applicable, suggest relevant LoRA models or textual inversions that would enhance this style.

Focus on creating prompts that will work consistently across different subjects while maintaining the analyzed style characteristics. Use only terminology with strong AI model training associations.

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
