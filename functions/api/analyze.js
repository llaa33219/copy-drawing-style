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

        // 극도로 정밀한 그림체 복사 분석 프롬프트
        const individualAnalysisPrompt = `You are a technical drawing style analyst for AI replication. Analyze this image with microscopic precision to extract every visual characteristic that defines this exact drawing style. Be extremely specific and technical.

**LINE ART PRECISION ANALYSIS:**
- Exact line weight measurements (thin/medium/thick ratios)
- Line endings (blunt cut, tapered fade, rounded caps)
- Line consistency (perfectly smooth vs slightly wobbly vs deliberately rough)
- Pen tool behavior (digital clean vectors vs natural brush strokes vs pencil texture)
- Outline treatment (thick outer lines vs uniform weight vs no outlines)
- Line opacity (solid 100% vs semi-transparent vs variable opacity)
- Line texture quality (perfectly clean vs slightly pixelated vs organic texture)

**PRECISE COLORING TECHNIQUE:**
- Color application method (bucket fill vs brush painting vs airbrush)
- Color transitions (hard edges vs soft gradients vs stepped color bands)
- Saturation intensity (highly saturated vs muted vs mixed levels)
- Color blending approach (no blending vs smooth gradients vs textured blending)
- Base color treatment (flat solid colors vs subtle variations vs noisy texture)
- Color temperature bias (warm-leaning vs cool-leaning vs neutral)

**EXACT SHADING METHODOLOGY:**
- Shadow edge quality (razor-sharp vs soft-feathered vs semi-hard)
- Highlight sharpness (pinpoint highlights vs broad soft highlights vs no highlights)
- Shadow color approach (darker base color vs purple/blue shadows vs warm shadows)
- Light direction consistency (single light source vs ambient vs multiple sources)
- Shadow density (solid opaque vs semi-transparent vs gradient density)
- Reflected light handling (strong bounced light vs subtle vs none)

**ANATOMICAL PROPORTION SPECIFICS:**
- Head-to-body ratio (specific measurements like 6 heads tall, 8 heads tall)
- Eye size relative to head (1/5 head width, 1/3 head width, etc.)
- Eye positioning (center line, slightly above, significantly above)
- Nose treatment (detailed realistic vs simple line vs dot vs absent)
- Mouth size and position (small delicate vs full vs line vs dot)
- Jaw and chin shape (sharp angular vs round soft vs square vs pointed)
- Limb thickness and joints (realistic vs noodle-thin vs chunky vs stick-figure)

**MICRO-DETAIL RENDERING:**
- Hair strand organization (individual strands vs chunky clumps vs flowing ribbons)
- Hair texture simulation (straight smooth vs wavy vs curly vs spiky)
- Clothing fold logic (realistic gravity vs stylized vs simplified vs angular)
- Fabric thickness representation (thin silk vs thick cotton vs stiff leather)
- Skin surface quality (perfectly smooth vs subtle texture vs pores vs shine)
- Eye detail level (simple dots vs detailed iris vs reflection highlights vs pupils)

**TECHNICAL EXECUTION MARKERS:**
- Digital tool signatures (Photoshop brush textures vs vector clean lines vs traditional media simulation)
- Pixel-level precision (clean anti-aliasing vs pixelated vs hand-drawn wobble)
- Color depth (simple palette vs complex gradations vs limited color count)
- Compression artifacts or intentional low-fi aesthetic
- Layer blending evidence (multiply shadows vs overlay highlights vs normal blending)

Focus on measurable, replicable visual characteristics. Describe exactly what tools and techniques would recreate this precise visual result.`;

        // 즉시 사용 가능한 Drawing Style 지시문 생성
        const synthesisPrompt = `You are creating a direct-use drawing style prompt for AI image generation. Based on the technical analyses below, write ONE complete paragraph that serves as an exact drawing instruction, not an image description.

**CRITICAL FORMAT:**
- Write as direct drawing commands, not image analysis
- Use imperative mood: "Draw with..." "Use..." "Apply..." "Render..."
- Never say "This image has..." or "The artwork shows..."
- Make it a complete style instruction that AI can follow immediately
- 200-300 words of pure drawing technique commands

**INSTRUCTION STYLE:**
Instead of: "This image uses clean line art with uniform thickness..."
Write: "Draw with clean line art using uniform thickness of 2-3px, apply cell-shaded coloring with..."

Instead of: "The character has 7-head proportions..."  
Write: "Use 7-head proportions for characters, position eyes at..."

**REQUIREMENTS:**
- Start directly with drawing commands
- Include all technical specifications as direct instructions
- Cover line art technique, coloring method, shading approach, proportions, detail rendering
- Use specific measurements and technical terms
- Write as one flowing paragraph of drawing instructions
- Make it immediately usable in AI art generation tools

**OUTPUT:**
Write only the final drawing style instruction paragraph. No analysis, no description, just pure drawing commands that replicate this exact style.

Individual technical analyses:`;

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
