import { describe, expect, it } from "vitest";
import { planShots } from "./director";
import type { StoryGraphData } from "./narrativeParser";

describe("Director Agent", () => {
  const sampleStoryGraph: StoryGraphData = {
    characters: [
      { name: "Rocky", role: "protagonist", description: "A boxer from Philadelphia with a heart of gold" },
      { name: "Adrian", role: "supporting", description: "Shy pet store clerk, Rocky's love interest" },
      { name: "Apollo", role: "antagonist", description: "Heavyweight champion, confident and charismatic" }
    ],
    locations: ["Philadelphia Streets", "Boxing Gym", "Pet Store", "Boxing Ring"],
    plotBeats: [
      { chapter: "1", summary: "Rocky meets Adrian at the pet store", emotion: "hopeful" },
      { chapter: "2", summary: "Rocky gets the opportunity to fight Apollo", emotion: "excited" },
      { chapter: "3", summary: "Rocky trains intensely for the fight", emotion: "determined" },
      { chapter: "4", summary: "The night before the fight, Rocky confides in Adrian", emotion: "vulnerable" },
      { chapter: "5", summary: "Rocky goes the distance with Apollo", emotion: "triumphant" }
    ],
    dialogue: [
      { character: "Rocky", text: "Yo Adrian!", context: "Calling out to Adrian" },
      { character: "Rocky", text: "I just want to go the distance", context: "Before the fight" }
    ]
  };

  const creativeBrief = {
    stylePreset: "rocky_70s_grit",
    format: "film_16x9" as const,
    targetRuntimeMinutes: 10
  };

  it("should generate a shot plan from story graph", async () => {
    const result = await planShots(sampleStoryGraph, creativeBrief);

    expect(result).toBeDefined();
    expect(result.scenes).toBeDefined();
    expect(result.scenes.length).toBeGreaterThan(0);
  }, 60000); // 60 second timeout for LLM call

  it("should create scenes with required properties", async () => {
    const result = await planShots(sampleStoryGraph, creativeBrief);

    result.scenes.forEach(scene => {
      expect(scene.sceneId).toBeDefined();
      expect(scene.sceneSummary).toBeDefined();
      expect(scene.location).toBeDefined();
      expect(scene.emotion).toBeDefined();
      expect(scene.characters).toBeDefined();
      expect(scene.shots).toBeDefined();
    });
  }, 60000);

  it("should decompose scenes into 3-5 shots", async () => {
    const result = await planShots(sampleStoryGraph, creativeBrief);

    result.scenes.forEach(scene => {
      expect(scene.shots.length).toBeGreaterThanOrEqual(3);
      expect(scene.shots.length).toBeLessThanOrEqual(5);
    });
  }, 60000);

  it("should generate valid shot specifications", async () => {
    const result = await planShots(sampleStoryGraph, creativeBrief);

    const firstScene = result.scenes[0];
    expect(firstScene).toBeDefined();

    firstScene!.shots.forEach(shot => {
      expect(shot.shotId).toBeDefined();
      expect(["wide", "medium", "close"]).toContain(shot.shotType);
      expect(["static", "slow_pan"]).toContain(shot.cameraStyle);
      expect(shot.characters).toBeDefined();
      expect(shot.lighting).toBeDefined();
      expect(shot.imagePrompt).toBeDefined();
      expect(shot.videoMotionPrompt).toBeDefined();
      expect(shot.durationSeconds).toBeGreaterThan(0);
    });
  }, 60000);

  it("should only use characters from story graph", async () => {
    const result = await planShots(sampleStoryGraph, creativeBrief);

    const validCharacters = new Set(sampleStoryGraph.characters.map(c => c.name));

    result.scenes.forEach(scene => {
      scene.characters.forEach(char => {
        expect(validCharacters.has(char)).toBe(true);
      });

      scene.shots.forEach(shot => {
        shot.characters.forEach(char => {
          expect(validCharacters.has(char)).toBe(true);
        });
      });
    });
  }, 60000);

  it("should generate appropriate shot IDs", async () => {
    const result = await planShots(sampleStoryGraph, creativeBrief);

    const firstScene = result.scenes[0];
    expect(firstScene).toBeDefined();

    firstScene!.shots.forEach((shot, index) => {
      // Shot IDs should follow pattern like S1_001, S1_002, etc.
      expect(shot.shotId).toMatch(/^S\d+_\d+$/);
    });
  }, 60000);

  it("should respect target runtime", async () => {
    const shortBrief = { ...creativeBrief, targetRuntimeMinutes: 5 };
    const result = await planShots(sampleStoryGraph, shortBrief);

    // Calculate total duration
    const totalDuration = result.scenes.reduce((sum, scene) => {
      return sum + scene.shots.reduce((shotSum, shot) => shotSum + shot.durationSeconds, 0);
    }, 0);

    const totalMinutes = totalDuration / 60;
    
    // Should be roughly within target (allow some flexibility)
    expect(totalMinutes).toBeLessThanOrEqual(shortBrief.targetRuntimeMinutes * 1.5);
  }, 60000);
});
