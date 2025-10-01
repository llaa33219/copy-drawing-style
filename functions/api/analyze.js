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

        const individualAnalysisPrompt = `You are a forensic art style analyst. Your mission is to deconstruct and document the provided image's style with extreme precision, creating a technical blueprint for its exact replication. Every visual element must be cataloged. Do not be concise; be exhaustive.

Generate a detailed report structured with the following sections. For each section, write a descriptive paragraph.

**1. Line Art Blueprint:**
Analyze the line art's core properties. Describe its weight (e.g., uniform, tapered, pressure-sensitive), thickness in pixels if possible, quality (e.g., clean digital vector, textured pencil, smooth ink), color (e.g., solid black, soft brown, colored), and its role in the image (e.g., strong defining outlines, minimal suggestive lines, completely lineless).

**2. Light & Shadow Map:**
Deconstruct the lighting and shading. Identify the shading technique (e.g., hard-edged cel shading with 2/3 tones, soft-blended gradients, painterly brushwork). Describe the quality of shadow edges (sharp, soft, diffused). Detail the lighting setup (e.g., single top-left light source, dramatic backlighting, soft ambient light) and the style of highlights (e.g., sharp specular dots, soft glows, rim lighting).

**3. Color Palette DNA:**
Define the image's color properties. Describe the overall saturation (e.g., highly saturated and vibrant, muted and desaturated), value range (e.g., high-key, low-key, full contrast), and color temperature (warm, cool, neutral). Identify any specific color harmonies or notable color choices.

**4. Surface & Texture Profile:**
Detail the textures and rendering of surfaces. Describe the overall finish (e.g., smooth digital, canvas texture, visible brushstrokes). Note any specific material rendering techniques for skin, hair, or clothing. Analyze edge control (e.g., crisp and sharp, soft and lost edges).

**5. Detail & Complexity Level:**
Quantify the level of detail across the image. Describe the complexity of facial features, hair rendering (individual strands vs. simple shapes), clothing patterns, and background elements. Is the style minimalist, balanced, or maximalist in its detail?

**6. Proportions & Anatomy Style (if applicable):**
Document the character proportions. Describe the head-to-body ratio, the size and style of the eyes, and the structure of facial features. Characterize the overall body type and limb proportions (e.g., realistic, stylized, chibi).

Your analysis must be purely visual and objective, providing enough information for another artist or AI to replicate the style without ever seeing the original image.`;

        // 즉시 사용 가능한 스타일 복사 프롬프트 생성기
        const synthesisPrompt = `You are a master prompt engineer specializing in perfect style replication for advanced generative AI. Your task is to synthesize the detailed forensic analyses below into a single, highly-descriptive, and unambiguous master prompt. The goal is to create a textual blueprint that, when given to an image generation AI, will reproduce the art style with maximum fidelity.

**Instructions:**
1.  Thoroughly review all the provided technical analyses. Identify and extract every key descriptor and stylistic nuance.
2.  Weave these details into a single, comprehensive paragraph. Do not summarize or omit information for the sake of brevity. The prompt must be dense with descriptive detail.
3.  Structure the paragraph logically. Start with the overall aesthetic, then flow through the core components: line art, color and light, shading, texture, detail level, and character proportions.
4.  Use precise and evocative language that AI models can interpret effectively. For example, instead of just "detailed," specify "intricately detailed with fine patterns on clothing and individually rendered hair strands."
5.  The final output must be ONE complete paragraph. It is a technical specification written in prose, designed for perfect replication. Every defining characteristic from the analyses must be included.

**The final prompt must be a masterclass in descriptive precision, leaving absolutely no aspect of the style to chance. Begin synthesis now based on the analyses below:**`;

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
