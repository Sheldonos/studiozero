import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { 
  createProject, 
  getProjectById, 
  getProjectsByUserId,
  updateProjectStatus,
  updateProject,
  createStoryGraph,
  getStoryGraphByProjectId,
  createScene,
  getScenesByProjectId,
  createShot,
  getShotsBySceneId,
  updateShot,
  getProjectStats
} from "./db";
import { parseNarrative } from "./agents/narrativeParser";
import { planShots, getStylePresetDescription } from "./agents/director";
import { generateImageSync, generateVideoSync, estimateImageCost, estimateVideoCost } from "./integrations/replicate";
import { storagePut } from "./storage";
import { generateProjectAudio } from "./agents/audioGenerator";
import { assembleFilm } from "./assembly/ffmpeg";
import { getAudioStemsByProjectId, createCustomAsset, getCustomAssetsByUser, deleteCustomAsset } from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  projects: router({
    // List all projects for the current user
    list: protectedProcedure.query(async ({ ctx }) => {
      const projects = await getProjectsByUserId(ctx.user.id);
      return projects;
    }),

    // Get a single project by ID
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const project = await getProjectById(input.id);
        
        if (!project) {
          throw new Error("Project not found");
        }
        
        if (project.userId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new Error("Unauthorized");
        }
        
        return project;
      }),

    // Get project with full details (scenes, shots, story graph)
    getDetails: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const project = await getProjectById(input.id);
        
        if (!project) {
          throw new Error("Project not found");
        }
        
        if (project.userId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new Error("Unauthorized");
        }
        
        const storyGraph = await getStoryGraphByProjectId(project.id);
        const scenes = await getScenesByProjectId(project.id);
        const stats = await getProjectStats(project.id);
        
        // Get shots for each scene
        const scenesWithShots = await Promise.all(
          scenes.map(async (scene) => {
            const shots = await getShotsBySceneId(scene.id);
            return { ...scene, shots };
          })
        );
        
        return {
          project,
          storyGraph,
          scenes: scenesWithShots,
          stats,
        };
      }),

    // Create a new project
    create: protectedProcedure
      .input(z.object({
        sourceTitle: z.string().min(1).max(255),
        sourceType: z.enum(["book", "script"]),
        sourceText: z.string().min(100), // At least 100 characters
        format: z.enum(["film_16x9", "series_16x9", "vertical_9x16"]),
        stylePreset: z.enum(["rocky_70s_grit", "a24_drama", "pixar_like", "anime_noir"]),
        castingOverrideMain: z.string().optional(),
        targetRuntimeMinutes: z.number().min(5).max(30).default(10),
        language: z.string().default("en"),
      }))
      .mutation(async ({ input, ctx }) => {
        console.log(`[Projects] Creating new project: ${input.sourceTitle}`);
        
        // Create project record
        const project = await createProject({
          userId: ctx.user.id,
          sourceTitle: input.sourceTitle,
          sourceType: input.sourceType,
          sourceFileUrl: null, // Text-based for MVP
          sourceFileKey: null,
          format: input.format,
          stylePreset: input.stylePreset,
          castingOverrideMain: input.castingOverrideMain || null,
          targetRuntimeMinutes: input.targetRuntimeMinutes,
          language: input.language,
          status: "NEW",
        });
        
        console.log(`[Projects] Project created with ID: ${project.id}`);
        
        // Start processing asynchronously (don't await)
        processProject(project.id, input.sourceText).catch(error => {
          console.error(`[Projects] Error processing project ${project.id}:`, error);
          updateProjectStatus(project.id, "FAILED").catch(console.error);
        });
        
        return project;
      }),

    // Get project statistics
    getStats: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const project = await getProjectById(input.id);
        
        if (!project) {
          throw new Error("Project not found");
        }
        
        if (project.userId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new Error("Unauthorized");
        }
        
        return getProjectStats(input.id);
      }),
  }),

  assets: router({
    // Upload custom visual asset
    upload: protectedProcedure
      .input(z.object({
        assetType: z.enum(["character_reference", "location_reference", "style_reference", "prop"]),
        assetName: z.string().min(1).max(255),
        assetData: z.string(), // Base64 encoded image
        projectId: z.number().optional(),
        description: z.string().optional(),
        tags: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Decode base64 image
        const imageBuffer = Buffer.from(input.assetData, "base64");
        
        // Upload to S3
        const assetKey = `users/${ctx.user.id}/assets/${input.assetType}_${Date.now()}.jpg`;
        const { url: assetUrl } = await storagePut(assetKey, imageBuffer, "image/jpeg");
        
        // Create database record
        const asset = await createCustomAsset({
          userId: ctx.user.id,
          projectId: input.projectId || null,
          assetType: input.assetType,
          assetName: input.assetName,
          assetUrl,
          assetKey,
          description: input.description || null,
          tags: input.tags ? JSON.stringify(input.tags) : null,
        });
        
        return asset;
      }),

    // List user's assets
    list: protectedProcedure.query(async ({ ctx }) => {
      const assets = await getCustomAssetsByUser(ctx.user.id);
      return assets.map(asset => ({
        ...asset,
        tags: asset.tags ? JSON.parse(asset.tags) : [],
      }));
    }),

    // Delete asset
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        // TODO: Verify ownership before deleting
        await deleteCustomAsset(input.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;

// ============ Background Processing ============

async function processProject(projectId: number, sourceText: string): Promise<void> {
  console.log(`[Pipeline] Starting processing for project ${projectId}`);
  
  try {
    const project = await getProjectById(projectId);
    if (!project) throw new Error("Project not found");
    
    // Phase 1: Parse narrative
    console.log(`[Pipeline] Phase 1: Parsing narrative...`);
    await updateProjectStatus(projectId, "INGESTION_STARTED");
    
    const storyGraph = await parseNarrative(sourceText, 30, 3);
    await createStoryGraph({
      projectId,
      characters: storyGraph.characters,
      locations: storyGraph.locations,
      plotBeats: storyGraph.plotBeats,
      dialogue: storyGraph.dialogue,
    });
    
    await updateProjectStatus(projectId, "PARSING_COMPLETE");
    console.log(`[Pipeline] Narrative parsing complete`);
    
    // Phase 2: Plan shots
    console.log(`[Pipeline] Phase 2: Planning shots...`);
    const shotPlan = await planShots(storyGraph, {
      stylePreset: project.stylePreset,
      format: project.format,
      targetRuntimeMinutes: project.targetRuntimeMinutes,
    });
    
    // Create scene and shot records
    for (const sceneSpec of shotPlan.scenes) {
      const scene = await createScene({
        projectId,
        sceneId: sceneSpec.sceneId,
        sceneSummary: sceneSpec.sceneSummary,
        location: sceneSpec.location,
        emotion: sceneSpec.emotion,
        characters: sceneSpec.characters,
        status: "PENDING",
      });
      
      for (const shotSpec of sceneSpec.shots) {
        await createShot({
          sceneId: scene.id,
          shotId: shotSpec.shotId,
          shotType: shotSpec.shotType,
          cameraStyle: shotSpec.cameraStyle,
          characters: shotSpec.characters,
          wardrobeLock: shotSpec.wardrobeLock ? 1 : 0,
          lighting: shotSpec.lighting,
          imagePrompt: shotSpec.imagePrompt,
          videoMotionPrompt: shotSpec.videoMotionPrompt,
          durationSeconds: shotSpec.durationSeconds,
          seed: Math.floor(Math.random() * 1000000),
          status: "PENDING",
        });
      }
    }
    
    await updateProjectStatus(projectId, "PLANNING_COMPLETE");
    console.log(`[Pipeline] Shot planning complete: ${shotPlan.scenes.length} scenes`);
    
    // Phase 3: Generate images
    console.log(`[Pipeline] Phase 3: Generating images...`);
    await updateProjectStatus(projectId, "IMAGE_GEN_IN_PROGRESS");
    
    const scenes = await getScenesByProjectId(projectId);
    let totalCost = 0;
    
    for (const scene of scenes) {
      const shots = await getShotsBySceneId(scene.id);
      
      for (const shot of shots) {
        try {
          console.log(`[Pipeline] Generating image for shot ${shot.shotId}...`);
          
          // Add style preset to prompt
          const styleDesc = getStylePresetDescription(project.stylePreset);
          const enhancedPrompt = `${shot.imagePrompt}, ${styleDesc}`;
          
          // Generate image
          const imageUrl = await generateImageSync({
            prompt: enhancedPrompt,
            width: project.format === "vertical_9x16" ? 576 : 1024,
            height: project.format === "vertical_9x16" ? 1024 : 576,
            seed: shot.seed || undefined,
          });
          
          // Upload to S3
          const imageResponse = await fetch(imageUrl);
          const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
          const imageKey = `projects/${projectId}/shots/${shot.shotId}.jpg`;
          const { url: s3Url } = await storagePut(imageKey, imageBuffer, "image/jpeg");
          
          // Update shot record
          await updateShot(shot.id, {
            imageUrl: s3Url,
            imageKey,
            status: "IMAGE_COMPLETE",
          });
          
          totalCost += estimateImageCost();
          
          console.log(`[Pipeline] Image generated for shot ${shot.shotId}`);
        } catch (error) {
          console.error(`[Pipeline] Error generating image for shot ${shot.shotId}:`, error);
          await updateShot(shot.id, { status: "IMAGE_FAILED" });
        }
      }
    }
    
    await updateProjectStatus(projectId, "IMAGES_COMPLETE");
    await updateProject(projectId, { totalCost });
    console.log(`[Pipeline] Image generation complete`);
    
    // Phase 4: Generate videos (simplified for MVP)
    console.log(`[Pipeline] Phase 4: Generating videos...`);
    await updateProjectStatus(projectId, "VIDEO_GEN_IN_PROGRESS");
    
    for (const scene of scenes) {
      const shots = await getShotsBySceneId(scene.id);
      
      for (const shot of shots) {
        if (shot.status !== "IMAGE_COMPLETE" || !shot.imageUrl) {
          continue;
        }
        
        try {
          console.log(`[Pipeline] Generating video for shot ${shot.shotId}...`);
          
          const videoUrl = await generateVideoSync({
            imageUrl: shot.imageUrl,
            motionPrompt: shot.videoMotionPrompt || "subtle movement",
          });
          
          // Upload to S3
          const videoResponse = await fetch(videoUrl);
          const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());
          const videoKey = `projects/${projectId}/shots/${shot.shotId}.mp4`;
          const { url: s3Url } = await storagePut(videoKey, videoBuffer, "video/mp4");
          
          await updateShot(shot.id, {
            videoUrl: s3Url,
            videoKey,
            status: "COMPLETE",
          });
          
          totalCost += estimateVideoCost();
          
          console.log(`[Pipeline] Video generated for shot ${shot.shotId}`);
        } catch (error) {
          console.error(`[Pipeline] Error generating video for shot ${shot.shotId}:`, error);
          await updateShot(shot.id, { status: "VIDEO_FAILED" });
        }
      }
    }
    
    await updateProjectStatus(projectId, "VIDEOS_COMPLETE");
    await updateProject(projectId, { totalCost });
    console.log(`[Pipeline] Video generation complete`);
    
    // Phase 5: Generate audio
    console.log(`[Pipeline] Phase 5: Generating audio...`);
    await updateProjectStatus(projectId, "AUDIO_GEN_IN_PROGRESS");
    
    try {
      const audioResult = await generateProjectAudio({
        projectId,
        storyGraph,
        scenes: shotPlan.scenes,
      });
      
      totalCost += audioResult.totalCost;
      await updateProject(projectId, { totalCost });
      
      await updateProjectStatus(projectId, "AUDIO_COMPLETE");
      console.log(`[Pipeline] Audio generation complete: ${audioResult.audioStems.length} stems`);
    } catch (error) {
      console.error(`[Pipeline] Error generating audio:`, error);
      // Continue without audio
    }
    
    // Phase 6: Assemble final film
    console.log(`[Pipeline] Phase 6: Assembling final film...`);
    await updateProjectStatus(projectId, "ASSEMBLY_IN_PROGRESS");
    
    try {
      // Collect all completed shots
      const allShots = [];
      for (const scene of scenes) {
        const sceneShots = await getShotsBySceneId(scene.id);
        const completedShots = sceneShots
          .filter(s => s.status === "COMPLETE" && s.videoUrl)
          .sort((a, b) => a.shotId.localeCompare(b.shotId));
        allShots.push(...completedShots);
      }
      
      if (allShots.length === 0) {
        throw new Error("No completed shots to assemble");
      }
      
      // Get audio stems
      const audioStems = await getAudioStemsByProjectId(projectId);
      
      // Assemble film
      const assemblyResult = await assembleFilm({
        projectId,
        shots: allShots.map((shot, index) => ({
          url: shot.videoUrl!,
          durationSeconds: shot.durationSeconds,
          order: index,
        })),
        audioTracks: audioStems.map(stem => ({
          url: stem.audioUrl!,
          type: stem.stemType as any,
          startTime: stem.startTimeSeconds || 0,
          volume: (stem.volume || 100) / 100,
        })),
        outputFormat: project.format,
      });
      
      // Update project with final video
      await updateProject(projectId, {
        finalRenderUrl: assemblyResult.videoUrl,
        finalRenderKey: assemblyResult.videoKey,
        totalCost,
      });
      
      await updateProjectStatus(projectId, "DELIVERED");
      console.log(`[Pipeline] Project ${projectId} processing complete! Final video: ${assemblyResult.videoUrl}`);
    } catch (error) {
      console.error(`[Pipeline] Error assembling film:`, error);
      // Mark as delivered anyway with individual shots
      await updateProjectStatus(projectId, "DELIVERED");
    }
    
  } catch (error) {
    console.error(`[Pipeline] Fatal error processing project ${projectId}:`, error);
    await updateProjectStatus(projectId, "FAILED");
    throw error;
  }
}
