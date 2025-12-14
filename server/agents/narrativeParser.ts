import { invokeLLM } from "../_core/llm";

export interface Character {
  name: string;
  role: string;
  description: string;
}

export interface PlotBeat {
  chapter: string;
  summary: string;
  emotion: string;
}

export interface DialogueLine {
  character: string;
  text: string;
  context: string;
}

export interface StoryGraphData {
  characters: Character[];
  locations: string[];
  plotBeats: PlotBeat[];
  dialogue: DialogueLine[];
}

const NARRATIVE_PARSER_PROMPT = `You are a narrative analysis expert. Your task is to extract structured information from the provided text.

Extract the following:
1. Characters: name, role (protagonist/antagonist/supporting), and brief description
2. Locations: list of distinct locations mentioned
3. Plot beats: chapter/section summaries with emotional tone
4. Dialogue: key dialogue lines with character and context

CONSTRAINTS:
- Maximum 3 main characters (protagonist + 2 supporting)
- Maximum 30 plot beats/scenes
- Focus on visual, cinematic moments
- Identify emotional beats (determination, fear, joy, sadness, anger, etc.)

Return ONLY valid JSON matching this schema:
{
  "characters": [{"name": "string", "role": "string", "description": "string"}],
  "locations": ["string"],
  "plotBeats": [{"chapter": "string", "summary": "string", "emotion": "string"}],
  "dialogue": [{"character": "string", "text": "string", "context": "string"}]
}`;

export async function parseNarrative(text: string, maxScenes: number = 30, maxCharacters: number = 3): Promise<StoryGraphData> {
  console.log("[NarrativeParser] Starting narrative parsing...");
  
  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: NARRATIVE_PARSER_PROMPT },
        { role: "user", content: `Parse this narrative text:\n\n${text}\n\nLimit to ${maxCharacters} main characters and ${maxScenes} scenes maximum.` }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "story_graph",
          strict: true,
          schema: {
            type: "object",
            properties: {
              characters: {
                type: "array",
                description: "List of main characters",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string", description: "Character name" },
                    role: { type: "string", description: "Character role (protagonist/antagonist/supporting)" },
                    description: { type: "string", description: "Brief character description" }
                  },
                  required: ["name", "role", "description"],
                  additionalProperties: false
                }
              },
              locations: {
                type: "array",
                description: "List of distinct locations",
                items: { type: "string" }
              },
              plotBeats: {
                type: "array",
                description: "Key plot moments/scenes",
                items: {
                  type: "object",
                  properties: {
                    chapter: { type: "string", description: "Chapter or section identifier" },
                    summary: { type: "string", description: "Brief scene summary" },
                    emotion: { type: "string", description: "Emotional tone" }
                  },
                  required: ["chapter", "summary", "emotion"],
                  additionalProperties: false
                }
              },
              dialogue: {
                type: "array",
                description: "Key dialogue lines",
                items: {
                  type: "object",
                  properties: {
                    character: { type: "string", description: "Speaking character" },
                    text: { type: "string", description: "Dialogue text" },
                    context: { type: "string", description: "Scene context" }
                  },
                  required: ["character", "text", "context"],
                  additionalProperties: false
                }
              }
            },
            required: ["characters", "locations", "plotBeats", "dialogue"],
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
    const storyGraph: StoryGraphData = JSON.parse(contentStr);
    
    // Enforce constraints
    if (storyGraph.characters.length > maxCharacters) {
      storyGraph.characters = storyGraph.characters.slice(0, maxCharacters);
    }
    
    if (storyGraph.plotBeats.length > maxScenes) {
      storyGraph.plotBeats = storyGraph.plotBeats.slice(0, maxScenes);
    }

    console.log(`[NarrativeParser] Parsed ${storyGraph.characters.length} characters, ${storyGraph.locations.length} locations, ${storyGraph.plotBeats.length} plot beats`);
    
    return storyGraph;
  } catch (error) {
    console.error("[NarrativeParser] Error parsing narrative:", error);
    throw new Error(`Failed to parse narrative: ${error instanceof Error ? error.message : String(error)}`);
  }
}
