import { invokeLLM } from "../_core/llm";
import { StoryGraphData } from "./narrativeParser";

export interface ShotSpec {
  shotId: string;
  shotType: "wide" | "medium" | "close";
  cameraStyle: "static" | "slow_pan";
  characters: string[];
  wardrobeLock: boolean;
  lighting: string;
  imagePrompt: string;
  videoMotionPrompt: string;
  durationSeconds: number;
}

export interface SceneSpec {
  sceneId: string;
  sceneSummary: string;
  location: string;
  emotion: string;
  characters: string[];
  shots: ShotSpec[];
}

export interface ShotPlan {
  scenes: SceneSpec[];
}

interface CreativeBrief {
  stylePreset: string;
  format: string;
  targetRuntimeMinutes: number;
}

const DIRECTOR_PROMPT = `You are the Director Agent of an autonomous AI film studio.

Your responsibility is to transform narrative content into a coherent, cinematic production optimized for image-to-video generation.

CONSTRAINTS:
- Each scene must be decomposed into visually consistent micro-shots
- Identity drift is unacceptable
- Assume image models generate stills, video models extend to 3–5s
- Continuity is more important than creativity

YOUR TASK:
Given the StoryGraph and CreativeBrief, you must:
1. Decide how many scenes are required
2. Define the emotional purpose of each scene
3. Break each scene into 3–5 shots
4. Enforce:
   - Consistent characters
   - Consistent wardrobe
   - Consistent lighting
5. Output a valid ShotSpec JSON

STYLE RULES:
- Use cinematic language
- Avoid unnecessary camera movement
- Favor medium and close shots
- Prioritize emotional clarity over spectacle

SHOT TYPES:
- wide: Establishing shot, shows full environment and characters
- medium: Waist-up or mid-range, good for dialogue and action
- close: Face/detail shots, emphasizes emotion

CAMERA STYLES:
- static: No camera movement, stable frame
- slow_pan: Gentle horizontal or vertical movement

IMAGE PROMPT GUIDELINES:
- Start with character name and description
- Include wardrobe details
- Specify lighting (e.g., "soft natural light", "dramatic shadows", "golden hour")
- Add style preset reference
- Include location details
- Keep prompts under 200 characters

VIDEO MOTION PROMPT GUIDELINES:
- Describe subtle, realistic motion
- Examples: "subtle head movement, natural breathing", "slow walk forward", "gentle hand gesture"
- Avoid complex actions

OUTPUT:
Return ONLY valid JSON following the ShotPlan schema.
Do not include explanations.
Do not hallucinate characters or locations.`;

export async function planShots(storyGraph: StoryGraphData, creativeBrief: CreativeBrief): Promise<ShotPlan> {
  console.log("[Director] Starting shot planning...");
  
  const characterNames = storyGraph.characters.map(c => c.name);
  const characterDescriptions = storyGraph.characters.map(c => `${c.name}: ${c.description}`).join("\n");
  
  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: DIRECTOR_PROMPT },
        { 
          role: "user", 
          content: `Plan shots for this story:

CHARACTERS:
${characterDescriptions}

LOCATIONS:
${storyGraph.locations.join(", ")}

PLOT BEATS:
${storyGraph.plotBeats.map((pb, i) => `${i + 1}. ${pb.summary} (${pb.emotion})`).join("\n")}

CREATIVE BRIEF:
- Style: ${creativeBrief.stylePreset}
- Format: ${creativeBrief.format}
- Target Runtime: ${creativeBrief.targetRuntimeMinutes} minutes

Create 3-5 shots per scene. Each shot should be 3-5 seconds.
Total scenes should fit within ${creativeBrief.targetRuntimeMinutes} minutes runtime.`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "shot_plan",
          strict: true,
          schema: {
            type: "object",
            properties: {
              scenes: {
                type: "array",
                description: "List of scenes with shot breakdowns",
                items: {
                  type: "object",
                  properties: {
                    sceneId: { type: "string", description: "Scene identifier (e.g., S1, S2)" },
                    sceneSummary: { type: "string", description: "Brief scene summary" },
                    location: { type: "string", description: "Scene location" },
                    emotion: { type: "string", description: "Emotional tone" },
                    characters: {
                      type: "array",
                      description: "Characters present in scene",
                      items: { type: "string" }
                    },
                    shots: {
                      type: "array",
                      description: "Shot breakdown for this scene",
                      items: {
                        type: "object",
                        properties: {
                          shotId: { type: "string", description: "Shot identifier (e.g., S1_001)" },
                          shotType: { 
                            type: "string", 
                            description: "Shot type",
                            enum: ["wide", "medium", "close"]
                          },
                          cameraStyle: { 
                            type: "string", 
                            description: "Camera movement style",
                            enum: ["static", "slow_pan"]
                          },
                          characters: {
                            type: "array",
                            description: "Characters visible in shot",
                            items: { type: "string" }
                          },
                          wardrobeLock: { 
                            type: "boolean", 
                            description: "Whether wardrobe must stay consistent" 
                          },
                          lighting: { type: "string", description: "Lighting description" },
                          imagePrompt: { type: "string", description: "Detailed prompt for image generation" },
                          videoMotionPrompt: { type: "string", description: "Motion description for video" },
                          durationSeconds: { type: "number", description: "Shot duration in seconds" }
                        },
                        required: [
                          "shotId", "shotType", "cameraStyle", "characters", 
                          "wardrobeLock", "lighting", "imagePrompt", 
                          "videoMotionPrompt", "durationSeconds"
                        ],
                        additionalProperties: false
                      }
                    }
                  },
                  required: ["sceneId", "sceneSummary", "location", "emotion", "characters", "shots"],
                  additionalProperties: false
                }
              }
            },
            required: ["scenes"],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content returned from LLM");
    }

    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
    const shotPlan: ShotPlan = JSON.parse(contentStr);
    
    // Validate that all characters exist in story graph
    const validCharacters = new Set(characterNames);
    for (const scene of shotPlan.scenes) {
      scene.characters = scene.characters.filter(c => validCharacters.has(c));
      for (const shot of scene.shots) {
        shot.characters = shot.characters.filter(c => validCharacters.has(c));
      }
    }

    console.log(`[Director] Planned ${shotPlan.scenes.length} scenes with ${shotPlan.scenes.reduce((sum, s) => sum + s.shots.length, 0)} total shots`);
    
    return shotPlan;
  } catch (error) {
    console.error("[Director] Error planning shots:", error);
    throw new Error(`Failed to plan shots: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export function getStylePresetDescription(preset: string): string {
  const presets: Record<string, string> = {
    "rocky_70s_grit": "1970s gritty realism, grainy film texture, muted colors, practical lighting, documentary-style cinematography",
    "a24_drama": "Modern indie drama, natural lighting, desaturated colors, intimate framing, contemplative mood",
    "pixar_like": "Vibrant 3D animation style, warm colors, expressive characters, clear lighting, family-friendly aesthetic",
    "anime_noir": "Japanese animation style, high contrast, dramatic shadows, stylized characters, moody atmosphere"
  };
  
  return presets[preset] || "Cinematic, professional film production quality";
}
