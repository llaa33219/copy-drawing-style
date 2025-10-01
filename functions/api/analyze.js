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
        const individualAnalysisPrompt = `You are an expert art style analyst. Describe this image's visual style in natural, flowing language as if explaining it to another artist. Modern AI image models understand conversational descriptions better than rigid lists.

Describe the style comprehensively, covering these aspects naturally:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📐 LINE ART TECHNICAL SPECS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Line weight range: Measure minimum to maximum thickness (e.g., "0.5px hairlines to 4px bold outlines")
- Line consistency: Perfectly uniform / Hand-tremor organic / Variable pressure-sensitive / Strategic weight distribution
- Line edge quality: Razor-sharp vector / Soft antialiased / Slightly fuzzy / Textured/grainy / Rough traditional media
- Outline style: Complete bold borders / Selective accent lines only / Broken/sketchy lines / No outlines (painterly)
- Line color treatment: Pure black #000000 / Dark brown/sepia / Colored to match subject / Gradient/multicolor lines
- Corner/intersection handling: Sharp angular joins / Soft rounded joins / Overlapping loose / Clean vector nodes
- Detail line usage: Fine interior details present / Minimal interior lines / No interior lines, only silhouettes

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎨 COLOR SYSTEM ARCHITECTURE  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Palette scope: Limited color count (specify number) / Moderate variety / Full spectrum / Near-monochrome
- Saturation profile: Ultra-vivid neon-like / High saturation / Medium saturation / Desaturated muted / Washed out pastel
- Brightness distribution: High-key bright dominant / Balanced mid-tones / Low-key dark moody / Extreme contrast range
- Color temperature bias: Warm (orange/red/yellow dominant) / Cool (blue/purple/cyan dominant) / Neutral balanced / Shifts per area
- Color harmony system: Monochromatic (single hue variations) / Analogous (neighboring hues) / Complementary (opposite hues) / Triadic / Tetrad / Random eclectic
- Color application method: Perfectly flat fills / Subtle gradients / Noisy/grainy fills / Textured color / Watercolor-like bleeds
- Color edge treatment: Hard edges / Soft feathered / Color bleeding intentionally / Precise contained

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 SHADING & LIGHTING ENGINEERING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Shading method: No shading (flat) / 2-tone cel / 3-4 tone cel / 5+ tone gradient / Smooth continuous gradient / Painterly blended
- Shadow edge hardness: Razor-sharp cutoff / Slightly soft / Heavily feathered blur / Gradient fade / Rough textured edge
- Shadow color strategy: Pure multiply darkening / Hue-shifted (e.g., blue shadows) / Colored shadows / Reflected light in shadows
- Shadow density: Subtle transparent / Medium density / Deep opaque / Extreme contrast
- Highlight technique: No highlights / Simple white dots / Gradient shine / Rim lighting / Complex specular / Exaggerated anime shine
- Light source: Single dominant source / Multiple sources / Ambient/flat lighting / Dramatic directional / Backlit silhouette
- Ambient occlusion: Present in crevices / Absent / Stylized contact shadows
- Reflected light: Bounce light visible / Not present / Stylized reflected colors

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🖼️ TEXTURE & SURFACE FINISH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Base finish: Pristine smooth digital / Soft airbrushed / Visible brush strokes / Rough painterly / Impasto thick paint texture
- Overlay texture: None / Fine paper grain / Canvas weave / Noise grain (specify %) / Halftone dots / Custom pattern
- Texture application: Uniform across image / Selective on certain elements / Randomized / Directional brushwork
- Edge rendering: Perfectly crisp / Slightly soft / Atmospheric fade / Deliberately rough/sketchy
- Material indication: Simplified symbolic / Moderately detailed / Photorealistic / Stylized/abstract interpretation

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 CHARACTER DESIGN MATHEMATICS (if present)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Head-to-body ratio: Specify exact ratio (e.g., "1:2.5 super-deformed chibi" or "1:7.5 realistic")
- Eye size relative to head: Specify percentage (e.g., "eyes are 1/3 of head height")
- Eye shape: Round / Almond / Sharp angular / Droopy / Tareme (gentle slope) / Tsurime (sharp upward)
- Eye detail level: Simple dot / Single highlight / Multiple highlights + iris detail / Photorealistic / Stylized pattern
- Pupil/iris rendering: Solid color / Gradient / Detailed pattern / Reflective / Symbolic/geometric
- Nose rendering: Detailed 3D / Simple wedge / Single line / Dot / Absent
- Mouth rendering: Detailed lips / Simple line / Dot / Stylized shape / Expression-dependent detail
- Face shape: Round soft / Oval standard / Sharp angular / Triangular / Square jaw / Long elegant
- Chin prominence: Pointed / Rounded / Flat / Pronounced / Subtle
- Body proportions: Anatomically accurate / Stylized slender / Muscular exaggerated / Curvy exaggerated / Geometric simplified
- Limb thickness: Thin delicate / Standard / Thick sturdy / Variable
- Hand/feet detail: Fully detailed / Simplified / Mitten-like / Hidden/avoided
- Hair structure: Individual strands / Chunky sections / Geometric shapes / Flowing ribbons / Wild spiky / Gravity-defying

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 DETAIL DENSITY MAPPING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Foreground detail: Extremely intricate / High / Moderate / Low / Minimal
- Mid-ground detail: (same scale)
- Background detail: (same scale)
- Detail consistency: Uniform throughout / Focal point detailed, rest simplified / Varied intentionally
- Clothing/fabric: Intricate patterns and folds / Moderate wrinkles / Simplified shapes / Flat no folds
- Hair strands: Individual strands visible / Grouped sections / Large chunks / Solid shapes
- Object detail: Realistic complexity / Moderate / Simplified graphic / Iconic minimal

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌌 SPATIAL & COMPOSITIONAL STRUCTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Perspective system: Flat 2D no perspective / Slight depth cues / Full linear perspective / Isometric / Fisheye distortion
- Depth indicators: None (flat) / Size diminishing / Atmospheric perspective / Overlapping layers / Full 3D rendering
- Background treatment: Highly detailed matching foreground / Simplified / Blurred bokeh / Abstract / Solid color / Gradient / Absent
- Focus technique: Everything sharp / Selective focus blur / Depth of field / Vignette darkening / Cinematic blur
- Spatial compression: Flat compressed / Moderate depth / Deep dimensional space

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ SPECIAL EFFECTS & POST-PROCESSING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Glow/bloom: None / Subtle / Moderate / Extreme halation
- Particle effects: None / Sparkles / Light rays / Magical aura / Environmental particles (dust, snow, etc.)
- Screen tone: None / Manga halftone dots / Gradient screens / Custom patterns
- Color grading: None / Warm filter / Cool filter / Faded vintage / High contrast / Muted desaturated / HDR-like
- Chromatic aberration: None / Subtle / Pronounced color fringing
- Vignette: None / Subtle / Heavy darkened corners
- Grain/noise: None / Subtle film grain / Heavy noise / Digital artifact aesthetic
- Other effects: (describe any unique effects like lens flares, motion blur, distortions, etc.)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎭 OVERALL AESTHETIC SIGNATURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Style family: Anime / Western cartoon / Semi-realistic illustration / Painterly / Graphic design / Vector art / Traditional media / Digital painting / Pixel art / Other (specify)
- Rendering philosophy: Minimalist / Moderate / Highly detailed / Maximalist
- Consistency: Perfectly uniform / Intentionally varied / Mixed media look
- Mood/atmosphere: Cute cheerful / Elegant refined / Dramatic intense / Calm peaceful / Dark moody / Energetic vibrant / Melancholic / Other (specify)
- Unique identifiers: (list any distinctive quirks that define this style - unusual color choices, signature techniques, recurring visual motifs, etc.)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FINAL OUTPUT FORMAT:
Write a comprehensive technical report covering ALL sections above. Be extremely specific with measurements, ratios, and technical terms. If certain elements aren't applicable (e.g., no characters in a landscape), state "N/A" for that section. Your goal is forensic-level precision that enables perfect replication.`;

        // 완벽한 그림체 복사 프롬프트 합성기
        const synthesisPrompt = `You are an expert AI art prompt engineer. You will receive detailed technical analyses of multiple images from the same art style. Your mission is to synthesize these into ONE PERFECT, COMPREHENSIVE style replication prompt.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL REQUIREMENTS FOR THE PERFECT PROMPT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. ✅ FORMAT STRUCTURE:
   - Start with the core style genre/family (e.g., "anime style", "semi-realistic digital illustration", "cel-shaded cartoon")
   - Build in LAYERS from general to specific
   - Use CONCRETE, VISUAL descriptors that AI understands
   - End with mood/atmosphere qualifiers

2. ✅ MANDATORY ELEMENTS TO INCLUDE (in order of importance):

   A. LINE ART (if present):
      - Exact line weight (thin/medium/thick + pixel measurement if possible)
      - Line quality (clean digital / sketchy / vector / hand-drawn)
      - Line color (black / colored / variable)
      - Outline presence (bold outlines / subtle / no outlines)
   
   B. COLOR SYSTEM:
      - Saturation level (vivid / muted / desaturated / pastel)
      - Color temperature (warm / cool / neutral)
      - Palette description (limited color palette / full spectrum / monochrome + specific color notes)
      - Color application (flat / gradients / textured)
   
   C. SHADING TECHNIQUE:
      - Method (flat / cel-shaded / soft gradient / painterly)
      - Shadow hardness (sharp / soft / blurred)
      - Shadow colors (standard / hue-shifted / colored)
      - Highlight style (sharp / soft / rim lighting / none)
   
   D. PROPORTIONS (if characters):
      - Head-body ratio (chibi 1:2 / standard 1:6 / realistic 1:7-8)
      - Eye size and detail (large expressive / realistic / simplified)
      - Facial feature treatment (detailed / simplified / stylized)
      - Body type (realistic / stylized / geometric)
   
   E. DETAIL LEVEL:
      - Overall complexity (highly detailed / moderate / minimalist)
      - Detail distribution (uniform / focal point emphasis)
      - Texture presence (smooth / grainy / brushy / textured)
   
   F. DEPTH & SPACE:
      - Perspective (flat 2D / slight depth / full 3D)
      - Background treatment (detailed / simplified / blurred / solid)
      - Focus (sharp / bokeh / depth of field)
   
   G. SPECIAL EFFECTS:
      - Glow/bloom (none / subtle / strong)
      - Particles, screen tones, filters (specify if present)
      - Post-processing (color grading, grain, etc.)
   
   H. MOOD & AESTHETIC:
      - Emotional tone (cute / dramatic / elegant / energetic / dark)
      - Overall feel (modern / retro / fantasy / realistic)

3. ✅ WRITING STYLE RULES:

   ❌ DON'T:
   - Don't use artist names, studio names, anime/manga titles
   - Don't use vague terms like "nice" or "good"
   - Don't write in sections or bullet points
   - Don't use technical jargon AI can't understand
   - Don't leave out any major element
   
   ✅ DO:
   - Use AI-friendly keywords (terms found in Stable Diffusion/Midjourney/NovelAI)
   - Be specific with measurements and ratios
   - Write as ONE flowing descriptive paragraph
   - Include subtle nuances that define the style
   - Balance all elements proportionally
   - Use sensory, visual language
   - Include texture and finish descriptors

4. ✅ PROMPT LENGTH: 250-400 words (comprehensive but not bloated)

5. ✅ QUALITY CHECKLIST - Your final prompt must:
   □ Be immediately copy-pastable into any AI art tool
   □ Cover ALL major visual aspects
   □ Use clear, concrete visual descriptors
   □ Sound natural, not like a list
   □ Capture the unique "fingerprint" of this style
   □ Enable accurate replication without seeing the original

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXAMPLE OUTPUT FORMAT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

"[Core style family] featuring [line art details], rendered with [color system specifics] showing [saturation/temperature notes]. The shading employs [shading technique] with [shadow characteristics] and [highlight description], creating [lighting mood]. [If characters: proportion details with head-body ratio, eye size/style, facial features]. The composition maintains [depth/perspective approach] with [background treatment] and [focus technique]. Details are [detail level] with [texture description], showing [specific detail notes]. [Special effects if any: glow, particles, etc.]. Color palette consists of [specific color notes] with [color harmony]. Surface finish is [texture/finish], edges are [edge treatment]. The overall aesthetic conveys [mood/atmosphere] with [unique identifying characteristics], resulting in a [final aesthetic summary]."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Now, analyze the individual style reports below and synthesize them into ONE PERFECT MASTER PROMPT following all rules above:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INDIVIDUAL STYLE ANALYSES:
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

