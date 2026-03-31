import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, decimal } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Custom visual assets uploaded by users
 */
export const customAssets = mysqlTable("custom_assets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  projectId: int("project_id"),
  assetType: mysqlEnum("asset_type", ["character_reference", "location_reference", "style_reference", "prop"]).notNull(),
  assetName: varchar("asset_name", { length: 255 }).notNull(),
  assetUrl: text("asset_url").notNull(),
  assetKey: text("asset_key").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  description: text("description"),
  tags: text("tags"), // JSON array of tags
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type CustomAsset = typeof customAssets.$inferSelect;
export type InsertCustomAsset = typeof customAssets.$inferInsert;

/**
 * Projects table - stores film/series generation projects
 */
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  
  // Source content
  sourceTitle: varchar("sourceTitle", { length: 255 }).notNull(),
  sourceType: mysqlEnum("sourceType", ["book", "script"]).notNull(),
  sourceFileUrl: text("sourceFileUrl"),
  sourceFileKey: text("sourceFileKey"),
  
  // Creative controls
  format: mysqlEnum("format", ["film_16x9", "series_16x9", "vertical_9x16"]).notNull(),
  stylePreset: varchar("stylePreset", { length: 100 }).notNull(),
  castingOverrideMain: text("castingOverrideMain"),
  targetRuntimeMinutes: int("targetRuntimeMinutes").default(10).notNull(),
  language: varchar("language", { length: 10 }).default("en").notNull(),
  
  // Status tracking
  status: mysqlEnum("status", [
    "NEW",
    "INGESTION_STARTED",
    "PARSING_COMPLETE",
    "PLANNING_COMPLETE",
    "IMAGE_GEN_IN_PROGRESS",
    "IMAGES_COMPLETE",
    "VIDEO_GEN_IN_PROGRESS",
    "VIDEOS_COMPLETE",
    "AUDIO_GEN_IN_PROGRESS",
    "AUDIO_COMPLETE",
    "ASSEMBLY_IN_PROGRESS",
    "DELIVERED",
    "NEEDS_REVIEW",
    "FAILED"
  ]).default("NEW").notNull(),
  
  retryCount: int("retryCount").default(0).notNull(),
  
  // Output
  finalRenderUrl: text("finalRenderUrl"),
  finalRenderKey: text("finalRenderKey"),
  
  // Metadata
  totalCost: int("totalCost").default(0).notNull(), // Cost in cents
  generationTimeSeconds: int("generationTimeSeconds"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

/**
 * Story graphs table - stores parsed narrative structure
 */
export const storyGraphs = mysqlTable("storyGraphs", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  
  // Narrative data (stored as JSON)
  characters: json("characters").$type<Array<{
    name: string;
    role: string;
    description: string;
  }>>(),
  
  locations: json("locations").$type<string[]>(),
  
  plotBeats: json("plotBeats").$type<Array<{
    chapter: string;
    summary: string;
    emotion: string;
  }>>(),
  
  dialogue: json("dialogue").$type<Array<{
    character: string;
    text: string;
    context: string;
  }>>(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StoryGraph = typeof storyGraphs.$inferSelect;
export type InsertStoryGraph = typeof storyGraphs.$inferInsert;

/**
 * Scenes table - stores scene breakdown
 */
export const scenes = mysqlTable("scenes", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  
  sceneId: varchar("sceneId", { length: 50 }).notNull(), // e.g., "S1", "S2"
  sceneSummary: text("sceneSummary"),
  location: varchar("location", { length: 255 }),
  emotion: varchar("emotion", { length: 100 }),
  
  // Characters present in this scene
  characters: json("characters").$type<string[]>(),
  
  status: mysqlEnum("status", [
    "PENDING",
    "SHOTS_PLANNED",
    "IMAGES_GENERATING",
    "IMAGES_COMPLETE",
    "VIDEOS_GENERATING",
    "VIDEOS_COMPLETE",
    "COMPLETE",
    "FAILED"
  ]).default("PENDING").notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Scene = typeof scenes.$inferSelect;
export type InsertScene = typeof scenes.$inferInsert;

/**
 * Shots table - stores individual shot specifications and generated assets
 */
export const shots = mysqlTable("shots", {
  id: int("id").autoincrement().primaryKey(),
  sceneId: int("sceneId").notNull(),
  
  shotId: varchar("shotId", { length: 50 }).notNull(), // e.g., "S1_001"
  shotType: mysqlEnum("shotType", ["wide", "medium", "close"]).notNull(),
  cameraStyle: varchar("cameraStyle", { length: 100 }),
  
  // Characters and visual specs
  characters: json("characters").$type<string[]>(),
  wardrobeLock: int("wardrobeLock").default(1).notNull(), // boolean as int
  lighting: varchar("lighting", { length: 255 }),
  
  // Prompts
  imagePrompt: text("imagePrompt").notNull(),
  videoMotionPrompt: text("videoMotionPrompt"),
  
  // Generation parameters
  seed: int("seed"),
  durationSeconds: int("durationSeconds").default(3).notNull(),
  
  // Generated assets
  imageUrl: text("imageUrl"),
  imageKey: text("imageKey"),
  videoUrl: text("videoUrl"),
  videoKey: text("videoKey"),
  
  // Quality metrics
  qualityScore: int("qualityScore"), // 0-100
  similarityScore: int("similarityScore"), // 0-100, for character consistency
  
  // Status tracking
  status: mysqlEnum("status", [
    "PENDING",
    "IMAGE_GENERATING",
    "IMAGE_COMPLETE",
    "IMAGE_FAILED",
    "VIDEO_GENERATING",
    "VIDEO_COMPLETE",
    "VIDEO_FAILED",
    "COMPLETE"
  ]).default("PENDING").notNull(),
  
  retryCount: int("retryCount").default(0).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().onUpdateNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Shot = typeof shots.$inferSelect;
export type InsertShot = typeof shots.$inferInsert;

/**
 * Generation jobs table - tracks async generation jobs
 */
export const generationJobs = mysqlTable("generationJobs", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  
  jobType: mysqlEnum("jobType", [
    "NARRATIVE_PARSING",
    "SCENE_PLANNING",
    "IMAGE_GENERATION",
    "VIDEO_GENERATION",
    "AUDIO_GENERATION",
    "ASSEMBLY"
  ]).notNull(),
  
  // External provider tracking
  providerJobId: varchar("providerJobId", { length: 255 }), // e.g., Replicate prediction ID
  provider: varchar("provider", { length: 100 }), // e.g., "replicate", "elevenlabs"
  
  // Job metadata
  metadata: json("metadata").$type<Record<string, unknown>>(),
  
  status: mysqlEnum("status", [
    "QUEUED",
    "PROCESSING",
    "COMPLETED",
    "FAILED",
    "CANCELLED"
  ]).default("QUEUED").notNull(),
  
  errorMessage: text("errorMessage"),
  
  // Cost tracking
  costCents: int("costCents").default(0).notNull(),
  
  // Timing
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GenerationJob = typeof generationJobs.$inferSelect;
export type InsertGenerationJob = typeof generationJobs.$inferInsert;

/**
 * Audio stems table - stores audio tracks for each scene
 */
export const audioStems = mysqlTable("audioStems", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  sceneId: int("sceneId"),
  
  stemType: mysqlEnum("stemType", ["dialogue", "narration", "music", "foley"]).notNull(),
  
  audioUrl: text("audioUrl"),
  audioKey: text("audioKey"),
  
  // Audio metadata
  durationSeconds: int("durationSeconds"),
  startTimeSeconds: int("startTimeSeconds").default(0), // Start time in final assembly
  volume: int("volume").default(100), // 0-100
  characterName: varchar("characterName", { length: 255 }), // For dialogue
  dialogueText: text("dialogueText"), // Original dialogue text
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AudioStem = typeof audioStems.$inferSelect;
export type InsertAudioStem = typeof audioStems.$inferInsert;
