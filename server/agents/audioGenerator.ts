/**
 * Audio Generation Agent
 * 
 * Generates dialogue, narration, and manages audio stems for film projects
 */

import { generateDialogue, generateNarration } from "../integrations/elevenlabs";
import { storagePut } from "../storage";
import { createAudioStem } from "../db";
import type { StoryGraphData } from "./narrativeParser";
import type { ShotPlan } from "./director";

interface AudioGenerationParams {
  projectId: number;
  storyGraph: StoryGraphData;
  scenes: ShotPlan["scenes"];
}

interface GeneratedAudio {
  audioStems: {
    id: number;
    stemType: string;
    audioUrl: string;
    startTime: number;
    duration: number;
  }[];
  totalCost: number;
}

/**
 * Generate all audio for a project
 */
export async function generateProjectAudio(
  params: AudioGenerationParams
): Promise<GeneratedAudio> {
  console.log(`[AudioGenerator] Starting audio generation for project ${params.projectId}`);
  
  const audioStems: GeneratedAudio["audioStems"] = [];
  let totalCost = 0;
  
  // 1. Generate narration for each scene
  console.log("[AudioGenerator] Generating scene narration...");
  let currentTime = 0;
  
  for (const scene of params.scenes) {
    try {
      // Create narration text from scene summary
      const narrationText = `Scene ${scene.sceneId}. ${scene.sceneSummary}. ${scene.location}.`;
      
      const audioBuffer = await generateNarration(narrationText);
      
      // Upload to S3
      const audioKey = `projects/${params.projectId}/audio/narration_${scene.sceneId}_${Date.now()}.mp3`;
      const { url: audioUrl } = await storagePut(audioKey, audioBuffer, "audio/mpeg");
      
      // Estimate duration (rough estimate: 150 words per minute, ~2.5 chars per word)
      const estimatedDuration = (narrationText.length / 2.5 / 150) * 60;
      
      // Save to database
      const stem = await createAudioStem({
        projectId: params.projectId,
        sceneId: null,
        stemType: "narration",
        audioUrl,
        audioKey,
        startTimeSeconds: Math.floor(currentTime),
        durationSeconds: Math.floor(estimatedDuration),
        volume: 80,
        characterName: null,
        dialogueText: narrationText,
      });
      
      audioStems.push({
        id: stem.id,
        stemType: "narration",
        audioUrl,
        startTime: currentTime,
        duration: estimatedDuration,
      });
      
      // Increment time for next scene
      const sceneDuration = scene.shots.reduce((sum, shot) => sum + shot.durationSeconds, 0);
      currentTime += sceneDuration;
      
      // ElevenLabs pricing: ~$0.30 per 1000 characters
      const cost = (narrationText.length / 1000) * 0.30;
      totalCost += cost;
      
      console.log(`[AudioGenerator] Generated narration for scene ${scene.sceneId}`);
      
    } catch (error) {
      console.error(`[AudioGenerator] Failed to generate narration for scene ${scene.sceneId}:`, error);
      // Continue with other scenes
    }
  }
  
  // 2. Generate dialogue for characters (if dialogue exists in story graph)
  if (params.storyGraph.dialogue && params.storyGraph.dialogue.length > 0) {
    console.log("[AudioGenerator] Generating character dialogue...");
    
    for (const dialogueEntry of params.storyGraph.dialogue) {
      try {
        // Find character info
        const character = params.storyGraph.characters.find(
          c => c.name === dialogueEntry.character
        );
        
        if (!character) {
          console.warn(`[AudioGenerator] Character ${dialogueEntry.character} not found in story graph`);
          continue;
        }
        
        const audioBuffer = await generateDialogue({
          characterName: character.name,
          characterRole: character.role,
          text: dialogueEntry.text,
        });
        
        // Upload to S3
        const audioKey = `projects/${params.projectId}/audio/dialogue_${character.name}_${Date.now()}.mp3`;
        const { url: audioUrl } = await storagePut(audioKey, audioBuffer, "audio/mpeg");
        
        // Estimate duration
        const estimatedDuration = (dialogueEntry.text.length / 2.5 / 150) * 60;
        
        // Save to database
        const stem = await createAudioStem({
          projectId: params.projectId,
          sceneId: null,
          stemType: "dialogue",
          audioUrl,
          audioKey,
          startTimeSeconds: 0, // Will be positioned during assembly
          durationSeconds: Math.floor(estimatedDuration),
          volume: 100,
          characterName: character.name,
          dialogueText: dialogueEntry.text,
        });
        
        audioStems.push({
          id: stem.id,
          stemType: "dialogue",
          audioUrl,
          startTime: 0,
          duration: estimatedDuration,
        });
        
        const cost = (dialogueEntry.text.length / 1000) * 0.30;
        totalCost += cost;
        
        console.log(`[AudioGenerator] Generated dialogue for ${character.name}`);
        
      } catch (error) {
        console.error(`[AudioGenerator] Failed to generate dialogue for ${dialogueEntry.character}:`, error);
      }
    }
  }
  
  console.log(`[AudioGenerator] Audio generation complete. Generated ${audioStems.length} stems, cost: $${totalCost.toFixed(2)}`);
  
  return {
    audioStems,
    totalCost,
  };
}

/**
 * Generate background music (placeholder - would integrate with music generation API)
 */
export async function generateBackgroundMusic(
  projectId: number,
  stylePreset: string,
  duration: number
): Promise<string> {
  console.log(`[AudioGenerator] Background music generation not yet implemented`);
  // TODO: Integrate with music generation API (e.g., Suno, Mubert)
  return "";
}
