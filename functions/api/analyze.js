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
        const individualAnalysisPrompt = `You are an expert art style analyzer for recreating drawing styles. Analyze the provided image and describe its art style in detail using ONLY visual characteristics. Do NOT mention artist names, studio names, anime/manga titles, or time periods.

Describe the following elements in a practical, actionable way:

1. LINEART CHARACTERISTICS:
   - Line thickness: (hairline thin / thin 1-2px / medium 2-3px / thick 3-5px / very thick 5px+)
   - Line quality: (smooth vector-like / hand-drawn organic / sketchy rough / clean digital / traditional media)
   - Line weight variation: (uniform consistent / tapered varied / pressure-sensitive / strategic emphasis)
   - Line presence: (strong defined outlines / subtle light lines / minimal lines / completely lineless)
   - Line color: (pure black / colored lines matching subjects / brown/sepia tones)

2. SHADING AND LIGHTING:
   - Shading technique: (flat no shading / 2-tone cel / 3-4 tone cel / smooth gradient / painterly blended)
   - Shadow edge quality: (hard sharp edges / soft feathered / diffused blurry)
   - Shadow complexity: (simple form shadows only / cast shadows included / ambient occlusion / complex lighting)
   - Highlight style: (sharp specular / soft glow / rim lighting / no highlights / exaggerated shine)
   - Overall lighting: (flat even / dramatic high contrast / soft diffused / backlit / multiple light sources)

3. COLOR PROPERTIES:
   - Saturation level: (highly saturated vivid / moderately saturated / muted desaturated / nearly grayscale)
   - Brightness range: (high key bright / balanced mid-tones / low key dark / full range)
   - Color temperature: (warm oranges-reds / cool blues-purples / neutral balanced)
   - Color harmony: (analogous similar hues / complementary contrasting / monochromatic / triadic / split-complementary)
   - Color treatment: (flat solid colors / gradient transitions / color noise/grain / color bleeding)

4. TEXTURE AND SURFACE:
   - Overall finish: (smooth pristine digital / soft airbrushed / visible brush strokes / impasto thick paint)
   - Texture overlay: (none / paper grain / canvas texture / noise grain / custom patterns)
   - Edge treatment: (crisp sharp / soft atmospheric / fuzzy dreamy / deliberately rough)
   - Material rendering: (simplified flat / suggested details / fully rendered / stylized interpretation)

5. DETAIL DENSITY:
   - Facial features: (highly detailed / moderately detailed / simplified stylized / minimalist abstract)
   - Hair rendering: (individual strands / chunky sections / simplified shapes / detailed flowing)
   - Clothing/objects: (intricate patterns / moderate detail / simplified shapes / minimalist)
   - Background: (highly detailed / moderately detailed / simplified / minimal / absent)
   - Overall approach: (maximalist busy / balanced / minimalist clean)

6. CHARACTER PROPORTIONS (if applicable):
   - Head-to-body ratio: (chibi 1:1-2 / cute 1:3-4 / standard 1:5-6 / realistic 1:7-8 / elongated 1:8+)
   - Eye size: (very large dominant / large expressive / moderate / small realistic / minimal dots)
   - Eye detail: (multiple highlights complex iris / simple highlights / solid color / line only)
   - Facial feature size: (small nose/mouth / proportionate / realistic / exaggerated)
   - Body type: (simplified geometric / stylized elegant / anatomically accurate / exaggerated muscular/curvy)
   - Limb proportions: (shortened cute / standard / elongated graceful / deliberately distorted)

7. COMPOSITION AND DEPTH:
   - Perspective: (flat 2D / slight depth / full 3D perspective / isometric)
   - Depth cues: (none / atmospheric fade / size scaling / overlapping layers / full atmospheric perspective)
   - Focus technique: (everything sharp / selective focus blur / depth of field / vignette)
   - Space treatment: (compressed flat / moderate depth / deep dimensional)

8. SPECIAL EFFECTS:
   - Glow/bloom: (none / subtle / pronounced / extreme)
   - Particle effects: (none / sparkles / light particles / magical effects)
   - Screen tone/pattern: (none / halftone dots / gradient screens / custom patterns)
   - Post-processing: (none / color grading / filters / distortion / chromatic aberration)

9. OVERALL AESTHETIC:
   - Visual complexity: (simple clean / moderately complex / highly detailed / maximalist)
   - Emotional tone: (cute cheerful / elegant refined / dramatic intense / calm serene / dark moody)
   - Rendering approach: (graphic flat / illustrative / semi-realistic / painterly / photorealistic)
   - Consistency: (uniform style throughout / mixed techniques / deliberately varied)

Provide a comprehensive description using these categories. Be specific and use the exact options provided where applicable. Focus on what makes this style unique and immediately replicable.`;

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
