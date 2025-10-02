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
        const individualAnalysisPrompt = `You are a master artist and art critic with decades of experience analyzing visual styles. Look at this image and describe its artistic style as if you're explaining it to another professional artist over coffee - use natural, flowing language that captures the soul of the artwork.

Focus on these essential visual elements that modern AI art models understand instinctively:

🎨 **Color & Palette**: Describe the color world - is it vibrant and saturated like a dream, or muted and desaturated like an old photograph? Are the colors warm and cozy like firelight, or cool and crisp like winter morning? How do the colors flow together - do they clash dramatically or harmonize peacefully? Note specific color relationships and any dominant hues that define the mood.

✏️ **Line & Drawing**: Look at the lines - are they clean and precise like digital vector art, or organic and flowing like natural brush strokes? Are the outlines bold and confident, or soft and whispery? Do the lines have weight and pressure variation, or are they uniform throughout? Notice how edges are rendered - sharp as a knife or soft as a whisper.

🌟 **Light & Shadow**: How does light behave in this world? Is the lighting dramatic and moody with deep, velvety shadows, or bright and even like studio lighting? Do shadows have color to them, or are they pure darkness? Are there highlights that sparkle and gleam, or is everything flatly illuminated? Notice the light direction and quality - is it a single light source casting long shadows, or ambient light wrapping around forms?

🖼️ **Texture & Surface**: What does the surface feel like? Is it smooth and polished like digital perfection, or rough and tactile like canvas or paper? Are there visible brush strokes dancing across the surface, or is it so smooth you could slide your hand across it? Look for any texture patterns, grain, or surface treatments that give the image its unique tactile quality.

👥 **Characters & Figures** (if present): Study the people or creatures - what are their proportions like? Are they stylized and exaggerated, or anatomically precise? How are their faces rendered - large expressive eyes that dominate the face, or realistic features in perfect proportion? Look at their poses, gestures, and how they move through space.

🏗️ **Composition & Space**: How is the space organized? Is it flat and two-dimensional like a medieval tapestry, or does it have depth and perspective pulling you into the distance? Is the background detailed and busy, or simple and supportive? How do elements relate to each other in the frame?

✨ **Special Effects & Atmosphere**: What makes this image magical? Is there a glow or bloom that makes light sources radiate? Any particles floating in the air, or magical auras surrounding objects? Notice the overall mood - is it whimsical and playful, mysterious and brooding, energetic and alive, or serene and contemplative?

🎯 **Distinctive Signature**: What makes this style utterly unique? Is there a particular quirk, motif, or approach that you'd recognize anywhere? Maybe unusual color choices, signature brush techniques, or a very specific way of handling certain elements.

Write this as a flowing, engaging description that another artist would find inspiring and technically useful. Be specific with visual details, but keep the language natural and artistic rather than clinical. Your description should help an AI perfectly replicate this exact aesthetic.`;

        // 완벽한 그림체 복사 프롬프트 합성기
        const synthesisPrompt = `You are a master prompt engineer who understands exactly how modern AI image models like GPT-4o, Qwen Image, and others think and create. You receive artistic style descriptions from multiple images that share the same visual aesthetic, and your job is to weave them into one perfect, flowing prompt that captures the soul of this style.

🎯 **Your Mission**: Create a single, natural-sounding prompt that an AI can immediately understand and use to replicate this exact artistic style. Think like the AI - what visual keywords, textures, lighting cues, and aesthetic markers would trigger the perfect recreation?

✨ **Key Elements to Capture** (blend them naturally, don't list them):

**Color Personality**: How do the colors feel? Are they warm and inviting like sunlight, cool and mysterious like moonlight, vibrant and electric like neon dreams, or soft and nostalgic like aged photographs? What color relationships make this style sing?

**Line & Form Language**: What visual vocabulary does this style speak? Clean, precise lines like digital architecture, or flowing, organic strokes like natural growth? Bold, confident outlines or soft, whispering edges? Uniform weight or dancing pressure variations?

**Light & Shadow Poetry**: How does illumination shape this world? Dramatic chiaroscuro with deep velvet shadows, or bright, even lighting like a perfect summer day? Do shadows carry color stories, or are highlights like stars in the night sky?

**Texture & Surface Stories**: What does touching this artwork feel like? Smooth as glass, rough as tree bark, grainy like sand, or brushy like wind through grass? Any special surface treatments that give it that unmistakable tactile quality?

**Character Essence** (if present): How do figures move through this aesthetic space? Stylized proportions that exaggerate emotion, or anatomical precision that grounds in reality? Eyes that dominate the soul, or features that blend harmoniously?

**Spatial Symphony**: How is the world arranged? Flat storytelling like ancient tapestries, or dimensional depth that pulls you into infinity? Busy backgrounds that compete for attention, or supportive simplicity that lets subjects shine?

**Magical Atmosphere**: What makes this style enchanting? Ethereal glows that make light dance, particle whispers floating through air, or moody atmospheres that wrap around your heart?

**Unique Signature**: What single element would you recognize anywhere? That distinctive quirk, motif, or approach that makes this style utterly itself?

🎨 **Writing Philosophy**: Write like a poet who paints with words. Make it flow like a river of visual inspiration. Be specific enough for perfect replication, but natural enough that it feels like describing a dream to a friend. Aim for 200-350 words that sing with visual music.

📝 **Perfect Prompt Structure**: Start with the heart of the style, layer in visual details like building a painting, and end with the emotional resonance that makes it unforgettable.

Now, take these artistic descriptions and distill them into visual poetry that any modern AI image model would kill to bring to life:`;

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
                        model: 'qwen3-vl-235b-a22b-instruct', // 최신 Qwen 비전 모델 사용
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
                model: 'qwen-vl-max-2024-11-28', // 최신 Qwen 비전 모델 사용
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
