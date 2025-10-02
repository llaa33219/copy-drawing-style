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

        const analysisPrompt = `You are a world-class art director and a master AI prompt engineer. Your task is to analyze a batch of images that all share the same distinct art style and synthesize their essence into a single, masterful, and descriptive prompt for a modern image generation AI (like DALL-E 3, Midjourney, or Stable Diffusion).

**Analyze the provided images holistically and identify the core stylistic "DNA".** Look beyond the subject matter and focus on the artistic execution.

**Your generated prompt must be a single, flowing paragraph written in natural, evocative language.** It should be a rich tapestry of descriptive terms that, when given to an AI, will replicate the style with high fidelity.

**Structure your description by weaving together these key elements:**

1.  **Core Identity & Medium:** Start with a high-level description. Is it a digital painting, a cel-shaded animation still, a watercolor illustration, a vector graphic? What is the overall feeling? (e.g., "A vibrant and clean digital illustration with a slick, professional finish...")

2.  **Line Art:** Describe the lines. Are they sharp and clean, or soft and sketchy? Is there a consistent line weight, or does it vary? Are the outlines prominent or subtle? What color are the lines? (e.g., "...characterized by precise, razor-thin black outlines that have a subtle, pressure-sensitive quality, becoming slightly thicker at character joints...")

3.  **Color Palette & Application:** Describe the colors. Is the palette vibrant and saturated, or muted and desaturated? Is it a limited color set or a full spectrum? Are the colors flat, or do they have gradients? (e.g., "...utilizing a high-saturation, pastel color palette dominated by soft pinks, sky blues, and creamy yellows. Colors are applied in perfectly flat, clean fills with no gradients...")

4.  **Shading & Lighting:** How are shadows and highlights rendered? Is it flat, 2-tone cel shading, or soft, blended gradients? Where does the light seem to come from? (e.g., "...with minimal but effective 2-tone cel shading. Shadows are hard-edged and rendered in a slightly darker, cooler tone of the base color, suggesting a strong, single overhead light source.")

5.  **Texture & Finish:** What is the surface quality? Is it perfectly smooth and digital, or is there a subtle paper grain or canvas texture? (e.g., "...The entire piece has a matte finish, with a very subtle, fine-grained noise overlay that gives it an organic, printed feel.")

6.  **Character Proportions & Features (if applicable):** If there are characters, describe their defining features. Are the proportions realistic, chibi, or stylized? How are the eyes, hair, and face rendered? (e.g., "...Characters are drawn in a semi-chibi style with a 1:3 head-to-body ratio, featuring large, expressive eyes with simple single-dot highlights and blocky, ribbon-like hair.")

7.  **Overall Mood & Atmosphere:** Conclude with the overall feeling the style evokes. Is it cheerful and energetic, calm and serene, or dark and moody? (e.g., "...The overall aesthetic is incredibly cute, cheerful, and friendly, creating a lighthearted and playful atmosphere.")

**CRITICAL RULES:**
- **DO NOT** use artist names, studio names, or the names of any specific media (e.g., "Ghibli style", "Pixar style"). Describe the *visuals*, not the origin.
- **DO NOT** use bullet points or numbered lists in your final output. It must be a single paragraph.
- The final output should **ONLY** be the generated prompt, without any introductions or explanations.

Synthesize the images into one perfect prompt now.`;

        const userContent = [
            {
                type: "text",
                text: analysisPrompt
            }
        ];

        images.forEach(imageUrl => {
            userContent.push({
                type: "image_url",
                image_url: {
                    url: imageUrl
                }
            });
        });

        const messages = [
            {
                role: "user",
                content: userContent
            }
        ];

        const response = await fetch('https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${env.DASHSCOPE_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'qwen3-vl-235b-a22b-instruct', // Reverted to the original model name
                messages: messages,
                max_tokens: 1500, // Reduced max_tokens as we expect a concise prompt
                temperature: 0.5 // Lower temperature for more focused and consistent output
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API 오류:', errorText);
            return Response.json({ 
                error: `API 호출 실패: ${response.status}`,
                details: errorText
            }, { status: response.status });
        }

        const result = await response.json();
        
        if (!result.choices || result.choices.length === 0 || !result.choices[0].message.content) {
            return Response.json({ error: '분석 결과가 비어있습니다.' }, { status: 500 });
        }

        const finalPrompt = result.choices[0].message.content;

        return Response.json({ 
            prompt: finalPrompt,
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
