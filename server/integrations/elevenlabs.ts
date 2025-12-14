/**
 * ElevenLabs API Integration for Voice Synthesis
 * 
 * Generates dialogue and narration audio for film projects
 */

interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  style?: number;
  use_speaker_boost?: boolean;
}

interface GenerateVoiceParams {
  text: string;
  voiceId?: string;
  model?: string;
  voiceSettings?: VoiceSettings;
}

interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category: string;
  description?: string;
}

/**
 * Generate speech from text using ElevenLabs API
 */
export async function generateVoice(params: GenerateVoiceParams): Promise<Buffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY environment variable is not set");
  }

  const {
    text,
    voiceId = "21m00Tcm4TlvDq8ikWAM", // Default: Rachel voice
    model = "eleven_monolingual_v1",
    voiceSettings = {
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0.0,
      use_speaker_boost: true
    }
  } = params;

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Accept": "audio/mpeg",
      "Content-Type": "application/json",
      "xi-api-key": apiKey
    },
    body: JSON.stringify({
      text,
      model_id: model,
      voice_settings: voiceSettings
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ElevenLabs API error: ${response.status} - ${error}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Get available voices from ElevenLabs
 */
export async function getAvailableVoices(): Promise<ElevenLabsVoice[]> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY environment variable is not set");
  }

  const response = await fetch("https://api.elevenlabs.io/v1/voices", {
    headers: {
      "xi-api-key": apiKey
    }
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ElevenLabs API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.voices || [];
}

/**
 * Character voice mapping for consistent character voices
 */
export const CHARACTER_VOICES: Record<string, { voiceId: string; name: string }> = {
  "male_protagonist": {
    voiceId: "pNInz6obpgDQGcFmaJgB", // Adam - Deep male voice
    name: "Adam"
  },
  "female_protagonist": {
    voiceId: "21m00Tcm4TlvDq8ikWAM", // Rachel - Calm female voice
    name: "Rachel"
  },
  "male_supporting": {
    voiceId: "yoZ06aMxZJJ28mfd3POQ", // Sam - Dynamic male voice
    name: "Sam"
  },
  "female_supporting": {
    voiceId: "jsCqWAovK2LkecY7zXl4", // Freya - Expressive female voice
    name: "Freya"
  },
  "narrator": {
    voiceId: "onwK4e9ZLuTAKqWW03F9", // Daniel - Authoritative narrator
    name: "Daniel"
  },
  "antagonist": {
    voiceId: "VR6AewLTigWG4xSOukaG", // Arnold - Strong male voice
    name: "Arnold"
  }
};

/**
 * Select appropriate voice for character based on role and gender
 */
export function selectVoiceForCharacter(characterName: string, role: string): string {
  // Simple heuristic: use role to determine voice
  const roleLower = role.toLowerCase();
  
  if (roleLower.includes("narrator")) {
    return CHARACTER_VOICES.narrator.voiceId;
  }
  
  if (roleLower.includes("protagonist") || roleLower.includes("main")) {
    // Default to male protagonist, could be enhanced with gender detection
    return CHARACTER_VOICES.male_protagonist.voiceId;
  }
  
  if (roleLower.includes("antagonist") || roleLower.includes("villain")) {
    return CHARACTER_VOICES.antagonist.voiceId;
  }
  
  // Default to supporting character voice
  return CHARACTER_VOICES.male_supporting.voiceId;
}

/**
 * Generate dialogue audio for a character
 */
export async function generateDialogue(params: {
  characterName: string;
  characterRole: string;
  text: string;
}): Promise<Buffer> {
  const voiceId = selectVoiceForCharacter(params.characterName, params.characterRole);
  
  return generateVoice({
    text: params.text,
    voiceId,
    voiceSettings: {
      stability: 0.6,
      similarity_boost: 0.8,
      style: 0.2,
      use_speaker_boost: true
    }
  });
}

/**
 * Generate narration audio
 */
export async function generateNarration(text: string): Promise<Buffer> {
  return generateVoice({
    text,
    voiceId: CHARACTER_VOICES.narrator.voiceId,
    voiceSettings: {
      stability: 0.7,
      similarity_boost: 0.75,
      style: 0.1,
      use_speaker_boost: true
    }
  });
}
