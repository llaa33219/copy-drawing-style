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

        // 개별 이미지 분석을 위한 영어 프롬프트
        const individualAnalysisPrompt = `Analyze this drawing/artwork image in extreme detail to understand its art style completely. Focus on these key elements:

**LINE ART ANALYSIS:**
- Line weight variation and control (uniform vs. dynamic)
- Pen pressure patterns (soft vs. hard)
- Line endings (sharp, rounded, tapered)
- Sketch roughness level (clean vs. rough)
- Cleanup style and precision level

**FORM AND PROPORTIONS:**
- Human proportions (how many heads tall, what's exaggerated)
- Facial ratios and features (eye size, nose shape, mouth position, jawline)
- Hand and foot detail level and simplification
- Deformation level and specific exaggerated parts
- Overall human figure representation style

**RENDERING TECHNIQUES:**
- Cell shading vs painting style vs hybrid approach
- Main color palette characteristics and tone
- Gradient usage and technique (smooth vs stepped)
- Highlight and rim lighting treatment
- Color saturation and brightness tendencies

**SHADING AND LIGHTING:**
- Light source setup (single, multiple, ambient)
- Shadow edge treatment (hard vs soft shadows)
- Reflected light and bounce light usage
- Ambient occlusion representation
- Volume and form expression methods

**TEXTURE AND DETAIL:**
- Hair rendering style (chunks, strand details, texture)
- Clothing fold and fabric representation patterns
- Skin texture treatment (smooth, rough, detail level)
- Special effects (gloss, transparency, reflection)
- Accessory and prop rendering style

**STYLE SIGNATURES:**
- Unique eye and eyebrow expression
- Nose and mouth simplification or emphasis methods
- Finger and joint representation characteristics
- Background treatment style (simple vs detailed)
- Character-background relationship

**TECHNICAL ASPECTS:**
- Brush types and texture effects used
- Blending modes and layer structure estimation
- Post-processing effects (color correction, filters)
- Noise or texture overlay usage
- Overall workflow estimation

Provide a detailed technical analysis in English that captures the exact style characteristics.`;

        // 종합 분석을 위한 영어 프롬프트
        const synthesisPrompt = `Based on the following individual art style analyses, create a comprehensive and unified art style description that captures the common elements and overall characteristics. Synthesize the information to create a single, detailed prompt that can be used to recreate this exact art style.

Format the final result as a complete, actionable prompt in this structure:
"[Overall Style Description], [Line Art Characteristics], [Coloring Method], [Shading Treatment], [Proportions and Forms], [Detail Level], [Special Effects], [Overall Atmosphere]"

The final prompt should be precise enough for AI art generators or artists to recreate the exact same style.

Individual analyses:`;

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
