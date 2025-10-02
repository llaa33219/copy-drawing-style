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

        // 최신 이미지 생성 모델용 그림체 완벽 묘사 분석기
        const individualAnalysisPrompt = `You are a master art director and visual style expert. Analyze this image and describe its artistic style in a way that would allow perfect recreation by modern AI image generation models like Qwen Image, GPT-4o Image, or similar systems.

Focus on creating a natural, conversational description that captures the essence of the visual style. Modern AI models excel at understanding artistic descriptions that feel like you're explaining the look to another artist in a studio.

Key elements to describe naturally in your analysis:

🎯 CORE VISUAL IDENTITY:
- What art movement or style family does this most resemble? (anime, realistic illustration, cartoon, painterly, digital art, etc.)
- What's the overall mood and atmosphere? (cheerful and cute, dark and mysterious, elegant and refined, energetic and vibrant, etc.)

🎨 COLOR LANGUAGE:
- How would you describe the color palette? (vibrant and saturated, muted and pastel, monochromatic, warm/cool tones)
- Are colors flat and graphic, or do they have gradients and depth?
- Is the lighting dramatic with strong contrasts, or soft and diffused?

✏️ LINE & FORM TREATMENT:
- How are lines handled? (clean and precise, sketchy and organic, bold and graphic, delicate and fine)
- Are forms simplified and stylized, or detailed and realistic?
- What's the level of detail? (highly intricate, moderately detailed, minimalist and clean)

🔥 SHADING & TEXTURE:
- How does light interact with surfaces? (smooth gradients, sharp shadows, soft diffusion, painterly blending)
- Are there visible textures? (smooth digital, brush stroke texture, grainy film, canvas-like)
- Any special effects? (glow, bloom, particles, filters, distortions)

📐 COMPOSITION & SPACE:
- How is depth created? (flat 2D, layered depth, full perspective, isometric)
- Background treatment? (detailed environment, blurred bokeh, solid colors, abstract patterns)
- Focus and depth of field? (everything sharp, selective focus, atmospheric perspective)

If there are characters or figures:
- Proportions and anatomy style? (realistic, stylized, chibi, exaggerated)
- Facial features treatment? (large expressive eyes, detailed realistic features, simplified cartoon)
- Pose and movement style? (dynamic action, static elegant, cute gestures)

Write your analysis as a flowing, natural description that captures the unique visual fingerprint of this style. Make it detailed enough that someone could recreate this exact look, but conversational enough that an AI can understand and interpret it effectively.`;

        // 완벽한 그림체 복사 프롬프트 합성기
        const synthesisPrompt = `You are a master AI art director who specializes in creating perfect replication prompts for modern image generation models like Qwen Image, GPT-4o Image, and similar systems.

I have multiple art style analyses from the same visual style. Your task is to synthesize them into ONE PERFECT, COMPREHENSIVE prompt that captures the complete visual essence and allows flawless recreation.

🎯 YOUR MISSION:
Create a prompt that feels like you're describing a distinctive artistic style to another artist in a creative studio - natural, flowing, and rich with visual detail.

📝 CRITICAL REQUIREMENTS:

1. START WITH CORE IDENTITY:
   - Begin with the primary art style family (anime, digital illustration, cartoon, realistic, painterly, etc.)
   - Immediately establish the overall mood and atmosphere

2. BUILD VISUAL LAYERS NATURALLY:
   - Line quality and treatment (clean precise, sketchy organic, bold graphic, delicate fine)
   - Color language (vibrant saturated, muted pastel, warm/cool, flat/gradient)
   - Lighting and shading approach (dramatic contrasts, soft diffusion, cel-shaded, painterly)
   - Detail level and texture (highly intricate, smooth digital, brush stroke texture)
   - Composition and depth (flat 2D, layered depth, full perspective)

3. INCLUDE CHARACTER SPECIFICS (if applicable):
   - Proportion style (chibi, realistic, stylized, exaggerated)
   - Facial feature treatment (large expressive eyes, detailed realistic, simplified cartoon)
   - Body type and pose style

4. ADD UNIQUE SIGNATURE ELEMENTS:
   - Special effects (glow, bloom, particles, filters)
   - Texture finishes (smooth, grainy, canvas-like, digital clean)
   - Any distinctive visual quirks that define this style

5. END WITH EMOTIONAL RESONANCE:
   - Overall aesthetic feeling (cute and cheerful, dark and mysterious, elegant and refined)

✨ PROMPT WRITING PHILOSOPHY:
- Write as ONE flowing, conversational description
- Use vivid, sensory language that paints a picture
- Be specific but not technical - describe what you SEE
- Make it feel like excited collaboration between artists
- Aim for 200-350 words that flow naturally

🎨 WHAT MAKES A PERFECT PROMPT:
- Immediately copy-pasteable into any modern AI image tool
- Captures the unique "visual fingerprint" of the style
- Natural enough that AI models intuitively understand
- Comprehensive enough for accurate replication

Now, synthesize the following style analyses into ONE MASTER PROMPT that perfectly captures this artistic style:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STYLE ANALYSES TO SYNTHESIZE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

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
                        model: 'qwen3-vl-235b-a22b-instruct',
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
                model: 'qwen3-vl-235b-a22b-instruct',
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
