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

        // 실용적 Drawing Style 복사 분석기
        const individualAnalysisPrompt = `You are a style copying expert. Analyze this image to extract the EXACT visual style characteristics that someone can immediately use to recreate the same style.

FOCUS ON ACTIONABLE STYLE ELEMENTS:

LINE STYLE:
What kind of lines? (clean vector lines, sketchy pencil lines, smooth brush strokes, rough textured lines)
Line thickness: (very thin, medium, thick, variable thickness)
Line color: (pure black, dark brown, colored outlines, no outlines)

COLOR STYLE:
Coloring method: (flat solid colors, soft gradients, cell shading, painterly blending)
Color intensity: (bright vivid colors, muted pastels, high contrast, low saturation)
Color palette: (warm colors, cool colors, limited palette, full spectrum)

PROPORTIONS:
Head-to-body ratio: (chibi 3-4 heads, anime 6-7 heads, realistic 8 heads)
Eye style: (large anime eyes, normal eyes, tiny eyes, detailed eyes, simple dot eyes)
Face shape: (round, oval, angular, heart-shaped)
Feature size: (big eyes small mouth, balanced features, exaggerated features)

SHADING STYLE:
Shadow type: (hard cell shadows, soft gradients, no shadows, dramatic shadows)
Highlight style: (bright highlights, subtle highlights, rim lighting, no highlights)
Light direction: (top lighting, side lighting, front lighting, ambient lighting)

DETAIL LEVEL:
Overall detail: (highly detailed, moderately detailed, simplified, minimalist)
Hair rendering: (individual strands, chunky sections, simple shapes, flowing masses)
Texture quality: (smooth surfaces, textured surfaces, rough sketchy, clean digital)

ARTISTIC MOOD:
Visual feel: (cute/kawaii, cool/edgy, warm/friendly, dark/dramatic, bright/cheerful)
Style genre: (anime, cartoon, realistic, chibi, comic book, painterly)

Give direct, clear descriptions that someone can immediately understand and copy.`;

        // 즉시 사용 가능한 스타일 복사 프롬프트 생성기
        const synthesisPrompt = `You are creating a perfect style copying prompt. Based on the analyses below, write ONE complete paragraph that tells an AI exactly how to recreate this drawing style.

REQUIREMENTS:
- Make it immediately usable in AI art tools like Stable Diffusion or Midjourney
- Use clear, direct style keywords that AI tools understand
- Include ALL key style elements in balanced way
- Write as one flowing paragraph without sections
- Focus on what makes this style unique and recognizable

INCLUDE THESE STYLE ELEMENTS EQUALLY:
1. Line work style (clean vector, sketchy, textured, thick/thin)
2. Color approach (flat colors, gradients, cell shading, palette type)
3. Proportions (head ratios, eye size, face shape, body type)
4. Shading method (hard shadows, soft gradients, lighting direction)
5. Detail level (highly detailed, simplified, texture quality)
6. Overall mood/feel (cute, dramatic, realistic, cartoon style)

WRITE LIKE THIS EXAMPLE:
"Draw in [style genre] with [line description], using [color method] with [palette type], [proportion details], [shading approach], [detail level], creating [mood/atmosphere]"

MAKE IT ACTIONABLE:
- Use terms AI tools recognize
- Be specific but not overly technical
- Make it sound natural, not like a list
- Include style-defining characteristics
- Balance all elements equally

Write ONE perfect paragraph (200-300 words) that captures the complete drawing style.

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
