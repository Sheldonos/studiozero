import { describe, expect, it, beforeAll } from "vitest";
import { 
  createProject, 
  getProjectById, 
  updateProjectStatus,
  createStoryGraph,
  getStoryGraphByProjectId,
  createScene,
  getScenesByProjectId,
  createShot,
  getShotsBySceneId,
  getProjectStats
} from "./db";

describe("Database Operations", () => {
  let testProjectId: number;
  let testSceneId: number;

  describe("Project Operations", () => {
    it("should create a new project", async () => {
      const project = await createProject({
        userId: 1,
        sourceTitle: "Test Film",
        sourceType: "book",
        sourceFileUrl: null,
        sourceFileKey: null,
        format: "film_16x9",
        stylePreset: "rocky_70s_grit",
        castingOverrideMain: null,
        targetRuntimeMinutes: 10,
        language: "en",
        status: "NEW",
      });

      expect(project).toBeDefined();
      expect(project.id).toBeGreaterThan(0);
      expect(project.sourceTitle).toBe("Test Film");
      expect(project.status).toBe("NEW");

      testProjectId = project.id;
    });

    it("should retrieve a project by ID", async () => {
      const project = await getProjectById(testProjectId);

      expect(project).toBeDefined();
      expect(project?.id).toBe(testProjectId);
      expect(project?.sourceTitle).toBe("Test Film");
    });

    it("should update project status", async () => {
      await updateProjectStatus(testProjectId, "PARSING_COMPLETE");

      const project = await getProjectById(testProjectId);
      expect(project?.status).toBe("PARSING_COMPLETE");
    });
  });

  describe("Story Graph Operations", () => {
    it("should create a story graph", async () => {
      const storyGraph = await createStoryGraph({
        projectId: testProjectId,
        characters: [
          { name: "Rocky", role: "protagonist", description: "A boxer from Philadelphia" },
          { name: "Adrian", role: "supporting", description: "Rocky's love interest" }
        ],
        locations: ["Philadelphia", "Boxing Gym"],
        plotBeats: [
          { chapter: "1", summary: "Rocky meets Adrian", emotion: "hopeful" }
        ],
        dialogue: [
          { character: "Rocky", text: "Yo Adrian!", context: "Calling out to Adrian" }
        ],
      });

      expect(storyGraph).toBeDefined();
      expect(storyGraph.projectId).toBe(testProjectId);
      expect(storyGraph.characters).toHaveLength(2);
    });

    it("should retrieve story graph by project ID", async () => {
      const storyGraph = await getStoryGraphByProjectId(testProjectId);

      expect(storyGraph).toBeDefined();
      expect(storyGraph?.projectId).toBe(testProjectId);
      expect(storyGraph?.characters).toHaveLength(2);
    });
  });

  describe("Scene Operations", () => {
    it("should create a scene", async () => {
      const scene = await createScene({
        projectId: testProjectId,
        sceneId: "S1",
        sceneSummary: "Rocky training montage",
        location: "Boxing Gym",
        emotion: "determination",
        characters: ["Rocky"],
        status: "PENDING",
      });

      expect(scene).toBeDefined();
      expect(scene.sceneId).toBe("S1");
      expect(scene.projectId).toBe(testProjectId);

      testSceneId = scene.id;
    });

    it("should retrieve scenes by project ID", async () => {
      const scenes = await getScenesByProjectId(testProjectId);

      expect(scenes).toBeDefined();
      expect(scenes.length).toBeGreaterThan(0);
      expect(scenes[0]?.sceneId).toBe("S1");
    });
  });

  describe("Shot Operations", () => {
    it("should create a shot", async () => {
      const shot = await createShot({
        sceneId: testSceneId,
        shotId: "S1_001",
        shotType: "wide",
        cameraStyle: "static",
        characters: ["Rocky"],
        wardrobeLock: 1,
        lighting: "dramatic shadows",
        imagePrompt: "Rocky in boxing gym, dramatic lighting",
        videoMotionPrompt: "subtle movement",
        seed: 12345,
        durationSeconds: 3,
        status: "PENDING",
      });

      expect(shot).toBeDefined();
      expect(shot.shotId).toBe("S1_001");
      expect(shot.sceneId).toBe(testSceneId);
    });

    it("should retrieve shots by scene ID", async () => {
      const shots = await getShotsBySceneId(testSceneId);

      expect(shots).toBeDefined();
      expect(shots.length).toBeGreaterThan(0);
      expect(shots[0]?.shotId).toBe("S1_001");
    });
  });

  describe("Project Stats", () => {
    it("should calculate project statistics", async () => {
      const stats = await getProjectStats(testProjectId);

      expect(stats).toBeDefined();
      expect(stats.totalScenes).toBe(1);
      expect(stats.totalShots).toBe(1);
      expect(stats.completedShots).toBe(0);
      expect(stats.failedShots).toBe(0);
    });
  });
});
