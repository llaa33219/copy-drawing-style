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

        const individualAnalysisPrompt = `You are a forensic art style analyst. Your mission is to deconstruct the **STYLE** of the provided image, completely ignoring its subject matter. Create a technical blueprint of the artistic techniques used, making it possible to apply this style to ANY new subject.

**CRITICAL INSTRUCTION: Do NOT describe what is IN the image (e.g., "a girl with a sword"). Describe HOW things are drawn (e.g., "metallic surfaces are rendered with sharp, high-contrast specular highlights").**

Generate a detailed report structured with the following sections. For each section, write a descriptive paragraph about the artistic technique.

**1. Style of Line Art:**
Analyze the rules of the line work. Is it present? If so, describe its weight (uniform, tapered), quality (clean vector, textured pencil), color, and thickness. How does the line art define forms?

**2. Style of Shading & Lighting:**
Deconstruct the lighting and shading methodology. What is the technique (hard-edged cel shading, soft-blended gradients, painterly)? How are shadow edges treated (sharp, soft)? What is the underlying logic of the lighting (e.g., simple ambient occlusion, complex multi-source lighting)? How are highlights rendered?

**3. Style of Color Usage:**
Define the rules of the color palette. Describe the typical saturation, value range, and temperature. Is there a consistent color harmony? How are colors applied (flat, gradients, textured)?

**4. Style of Surface & Texture Rendering:**
Detail the techniques for rendering surfaces. What is the default surface finish (smooth, textured, painterly)? How are different materials like skin, hair, or fabric typically rendered within this style?

**5. Style of Detail & Complexity:**
Quantify the stylistic approach to detail. Where is detail concentrated (e.g., eyes, accessories) and where is it simplified (e.g., backgrounds, clothing)? Is the overall style minimalist, balanced, or maximalist?

**6. Style of Proportions & Form (if applicable):**
Document the rules for anatomical stylization. Describe the typical head-to-body ratio, eye-to-head ratio, and facial feature construction. How are forms simplified or exaggerated compared to reality?

Your analysis must be a purely technical description of the style itself, providing a replicable formula.`;

        // 즉시 사용 가능한 스타일 복사 프롬프트 생성기
        const synthesisPrompt = `You are a master prompt engineer creating a definitive style guide from technical analyses. Your task is to synthesize the forensic style reports below into a single, master prompt that describes the **ART STYLE** itself, divorced from any specific subject matter. The final prompt is a formula for recreating the style.

**CRITICAL INSTRUCTION: The final prompt must describe a set of artistic rules and techniques. It must NOT contain any descriptions of the subjects from the original images (e.g., characters, objects, scenes). It must be universally applicable to any new subject.**

**Instructions:**
1.  Review all the technical style analyses to build a complete picture of the artistic formula.
2.  Synthesize all the stylistic rules—line art, shading, color, texture, detail, and proportions—into a single, comprehensive, and highly-descriptive paragraph.
3.  Every sentence must describe a technique, a process, or a stylistic choice. For example, instead of "the girl has glowing eyes," write "eyes are rendered with a luminous glow effect and multiple, sharp specular highlights."
4.  The paragraph must be a dense, technical, and unambiguous description. It is a prose-based style guide for an AI to execute perfectly.
5.  Ensure every defining characteristic from the analyses is integrated. Omit nothing.

**The final prompt must be a masterclass in describing artistic technique, enabling an AI to apply this exact style to any subject imaginable. Begin synthesis now based on the analyses below:**`;

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
