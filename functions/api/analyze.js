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

        // 최신 AI 이미지 생성 모델 최적화된 개별 이미지 스타일 분석 프롬프트
        const individualAnalysisPrompt = `You are a master art style analyst for modern AI image generation systems like GPT-4o, FLUX, Midjourney v7, and Claude 3.5 Sonnet. Your mission is to analyze this artwork and create a comprehensive natural language description that can be directly used to recreate this exact artistic style.

Focus on creating flowing, descriptive sentences rather than technical bullet points. Modern AI models excel at understanding nuanced artistic descriptions written in natural language.

**ARTISTIC ESSENCE DESCRIPTION:**
Describe the overall artistic mood, atmosphere, and emotional quality. What feeling does this artwork evoke? How would you describe it to someone who has never seen it?

**VISUAL STORYTELLING APPROACH:**
How does the artist construct the visual narrative? Describe the compositional choices, focal points, and how elements guide the viewer's eye through the piece.

**LINE WORK CHARACTER:**
Describe the personality of the lines - are they confident and bold, delicate and whispered, energetic and gestural, or precise and controlled? How do the lines contribute to the overall emotional impact?

**COLOR PHILOSOPHY:**
What story do the colors tell? Describe the color relationships, harmonies, and how color choices support the mood. Are the colors vibrant and joyful, muted and contemplative, dramatic and intense, or soft and dreamy?

**LIGHTING NARRATIVE:**
How does light behave in this artwork? Describe it as if explaining a lighting setup for a film scene - where does light come from, how does it shape forms, and what atmosphere does it create?

**SURFACE QUALITY AND TEXTURE:**
Describe how different materials and surfaces are portrayed. How does the artist make you feel the texture of hair, fabric, skin, or other elements through visual means?

**PROPORTIONAL AESTHETICS:**
How does the artist interpret human or object proportions? Describe the stylistic choices in a way that conveys the aesthetic philosophy behind these decisions.

**STYLISTIC HERITAGE:**
What artistic movements, cultural influences, or other artworks does this remind you of? Connect it to broader artistic contexts in a natural, conversational way.

**TECHNICAL EXECUTION:**
Describe how you imagine this artwork was created - what tools, techniques, and artistic processes contributed to its final appearance?

**UNIQUE SIGNATURE ELEMENTS:**
What makes this artwork instantly recognizable? Describe the distinctive visual elements that set it apart from other styles.

Write your analysis as if you're describing this artwork to an AI that needs to understand not just what it looks like, but how it feels and what artistic intent drives every visual choice. Use rich, descriptive language that captures both technical aspects and emotional resonance.`;

        // 최신 AI 이미지 생성 모델을 위한 종합 분석 프롬프트
        const synthesisPrompt = `You are an expert prompt engineer specializing in modern AI image generation systems (GPT-4o, FLUX, Midjourney v7, Claude 3.5 Sonnet, DALL-E 3). Your mission is to synthesize the following individual artwork analyses into one masterful, natural language style description that will enable any modern AI to perfectly recreate this artistic style.

**SYNTHESIS OBJECTIVES:**
1. Create a flowing, narrative-style description rather than technical specifications
2. Focus on artistic emotion, mood, and visual storytelling elements
3. Use language that modern AI models trained on vast artistic datasets will deeply understand
4. Capture the essence that makes this style unique and immediately recognizable
5. Write as if describing this style to a brilliant artist who needs to understand both technique and artistic soul

**REQUIRED OUTPUT FORMAT:**

**MASTER STYLE DESCRIPTION:**
Create a comprehensive, eloquent paragraph (150-300 words) that captures the complete artistic essence of this style. Write it as a single flowing description that an AI can use directly as a style prompt. Focus on:
- The emotional and atmospheric qualities
- The artistic philosophy and approach  
- The distinctive visual characteristics
- The technical execution in artistic terms
- The cultural and aesthetic context
- The unique elements that define this style

**STYLE REPLICATION GUIDE:**
Provide specific guidance in natural language about how to achieve this style:
- "To recreate this style, focus on..."
- "The key to capturing this aesthetic is..."
- "This style achieves its distinctive look through..."

**ARTISTIC INSPIRATION CONTEXT:**
Brief context about what artistic movements, influences, or creative approaches this style embodies.

Remember: Modern AI image generation models are sophisticated enough to understand complex artistic language and emotional descriptions. They respond better to rich, descriptive prose than to technical parameters. Write as if you're describing this style to Claude, GPT-4o, or FLUX - they understand artistic nuance, cultural context, and aesthetic philosophy.

Individual artwork analyses to synthesize:`;

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
