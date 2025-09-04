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

        // 그림체 복사에 특화된 시각적 특징 분석 프롬프트
        const individualAnalysisPrompt = `You are analyzing this image to extract the exact visual drawing style for AI image generation. Focus ONLY on the visual characteristics that define how this artwork looks, not the content, story, or emotions.

**LINE ART STYLE:**
Describe the line work: thickness variation, line endings, sketchy vs clean, pressure sensitivity, outline treatment, line texture and quality.

**COLORING METHOD:**
Describe the exact coloring technique: flat colors vs gradients, cell shading vs soft painting, color blending style, saturation levels, color application method.

**SHADING AND LIGHTING TECHNIQUE:**
Describe how shadows and highlights are applied: hard vs soft shadows, light source behavior, contrast levels, shadow shapes, highlight placement.

**PROPORTIONS AND ANATOMY:**
Describe the specific proportional choices: head-to-body ratios, facial feature sizes and positions, limb proportions, stylization level, deformation patterns.

**DETAIL RENDERING:**
Describe how details are handled: hair texture style, clothing fold treatment, skin rendering, eye design, facial feature simplification.

**COLOR PALETTE:**
Describe the specific color usage: dominant colors, color relationships, brightness/darkness tendency, color harmony type.

**VISUAL TEXTURE:**
Describe surface treatments: smooth vs textured, brush stroke visibility, material representation style, finish quality (matte/glossy).

**STYLE CLASSIFICATION:**
What existing art styles does this most resemble? (anime, cartoon, realistic, painterly, vector, etc.)

Focus purely on visual characteristics that would allow someone to replicate this exact drawing style. Avoid emotional, philosophical, or narrative descriptions.`;

        // 그림체 복사를 위한 종합 분석 프롬프트
        const synthesisPrompt = `You are creating a unified style replication prompt for AI image generation. Based on the visual style analyses below, synthesize all information into ONE complete, natural-flowing paragraph that tells an AI exactly how to draw in this style.

**REQUIREMENTS:**
- Create a single, comprehensive paragraph (150-250 words)
- Include all technical details in natural language flow
- Cover: line art, coloring method, shading, proportions, details, palette, texture
- Use specific, actionable instructions
- Write as one continuous description, not separate sections
- Focus purely on visual replication techniques
- Avoid emotional or artistic interpretation language

**OUTPUT FORMAT:**
Write only the final unified prompt as a single paragraph, starting directly with the style description. Do not use headings, sections, or bullet points. Make it flow naturally as one complete instruction that can be directly used in AI art generation tools.

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
