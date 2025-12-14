import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  projects, 
  InsertProject, 
  Project,
  scenes,
  InsertScene,
  Scene,
  shots,
  InsertShot,
  Shot,
  storyGraphs,
  InsertStoryGraph,
  StoryGraph,
  generationJobs,
  InsertGenerationJob,
  GenerationJob,
  audioStems,
  InsertAudioStem,
  AudioStem,
  customAssets,
  InsertCustomAsset,
  CustomAsset
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ User Operations ============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ Project Operations ============

export async function createProject(data: InsertProject): Promise<Project> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(projects).values(data);
  const insertedId = Number(result[0].insertId);
  
  return getProjectById(insertedId) as Promise<Project>;
}

export async function getProjectById(id: number): Promise<Project | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  return result[0];
}

export async function getProjectsByUserId(userId: number): Promise<Project[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(projects).where(eq(projects.userId, userId)).orderBy(desc(projects.createdAt));
}

export async function updateProjectStatus(id: number, status: Project["status"]): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(projects).set({ status }).where(eq(projects.id, id));
}

export async function updateProject(id: number, data: Partial<Project>): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(projects).set(data).where(eq(projects.id, id));
}

export async function incrementProjectRetry(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const project = await getProjectById(id);
  if (project) {
    await db.update(projects).set({ retryCount: project.retryCount + 1 }).where(eq(projects.id, id));
  }
}

// ============ Story Graph Operations ============

export async function createStoryGraph(data: InsertStoryGraph): Promise<StoryGraph> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(storyGraphs).values(data);
  const insertedId = Number(result[0].insertId);
  
  const inserted = await db.select().from(storyGraphs).where(eq(storyGraphs.id, insertedId)).limit(1);
  return inserted[0] as StoryGraph;
}

export async function getStoryGraphByProjectId(projectId: number): Promise<StoryGraph | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(storyGraphs).where(eq(storyGraphs.projectId, projectId)).limit(1);
  return result[0];
}

// ============ Scene Operations ============

export async function createScene(data: InsertScene): Promise<Scene> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(scenes).values(data);
  const insertedId = Number(result[0].insertId);
  
  const inserted = await db.select().from(scenes).where(eq(scenes.id, insertedId)).limit(1);
  return inserted[0] as Scene;
}

export async function getScenesByProjectId(projectId: number): Promise<Scene[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(scenes).where(eq(scenes.projectId, projectId));
}

export async function updateSceneStatus(id: number, status: Scene["status"]): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(scenes).set({ status }).where(eq(scenes.id, id));
}

// ============ Shot Operations ============

export async function createShot(data: InsertShot): Promise<Shot> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(shots).values(data);
  const insertedId = Number(result[0].insertId);
  
  const inserted = await db.select().from(shots).where(eq(shots.id, insertedId)).limit(1);
  return inserted[0] as Shot;
}

export async function getShotsBySceneId(sceneId: number): Promise<Shot[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(shots).where(eq(shots.sceneId, sceneId));
}

export async function getShotById(id: number): Promise<Shot | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(shots).where(eq(shots.id, id)).limit(1);
  return result[0];
}

export async function updateShot(id: number, data: Partial<Shot>): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(shots).set(data).where(eq(shots.id, id));
}

export async function updateShotStatus(id: number, status: Shot["status"]): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(shots).set({ status }).where(eq(shots.id, id));
}

export async function incrementShotRetry(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const shot = await getShotById(id);
  if (shot) {
    await db.update(shots).set({ retryCount: shot.retryCount + 1 }).where(eq(shots.id, id));
  }
}

// ============ Generation Job Operations ============

export async function createGenerationJob(data: InsertGenerationJob): Promise<GenerationJob> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(generationJobs).values(data);
  const insertedId = Number(result[0].insertId);
  
  const inserted = await db.select().from(generationJobs).where(eq(generationJobs.id, insertedId)).limit(1);
  return inserted[0] as GenerationJob;
}

export async function getJobsByProjectId(projectId: number): Promise<GenerationJob[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(generationJobs).where(eq(generationJobs.projectId, projectId)).orderBy(desc(generationJobs.createdAt));
}

export async function updateJobStatus(id: number, status: GenerationJob["status"], errorMessage?: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const updates: Partial<GenerationJob> = { status };
  if (status === "COMPLETED") {
    updates.completedAt = new Date();
  }
  if (errorMessage) {
    updates.errorMessage = errorMessage;
  }

  await db.update(generationJobs).set(updates).where(eq(generationJobs.id, id));
}

// ============ Audio Stem Operations ============

export async function createAudioStem(data: InsertAudioStem): Promise<AudioStem> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(audioStems).values(data);
  const insertedId = Number(result[0].insertId);
  
  const inserted = await db.select().from(audioStems).where(eq(audioStems.id, insertedId)).limit(1);
  return inserted[0] as AudioStem;
}

export async function getAudioStemsByProjectId(projectId: number): Promise<AudioStem[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(audioStems).where(eq(audioStems.projectId, projectId));
}

export async function getAudioStemsBySceneId(sceneId: number): Promise<AudioStem[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(audioStems).where(eq(audioStems.sceneId, sceneId));
}

// ============ Analytics & Reporting ============

export async function getProjectStats(projectId: number): Promise<{
  totalScenes: number;
  totalShots: number;
  completedShots: number;
  failedShots: number;
  totalCost: number;
}> {
  const db = await getDb();
  if (!db) return { totalScenes: 0, totalShots: 0, completedShots: 0, failedShots: 0, totalCost: 0 };

  const projectScenes = await getScenesByProjectId(projectId);
  const project = await getProjectById(projectId);
  
  let totalShots = 0;
  let completedShots = 0;
  let failedShots = 0;

  for (const scene of projectScenes) {
    const sceneShots = await getShotsBySceneId(scene.id);
    totalShots += sceneShots.length;
    completedShots += sceneShots.filter(s => s.status === "COMPLETE").length;
    failedShots += sceneShots.filter(s => s.status === "IMAGE_FAILED" || s.status === "VIDEO_FAILED").length;
  }

  return {
    totalScenes: projectScenes.length,
    totalShots,
    completedShots,
    failedShots,
    totalCost: project?.totalCost || 0,
  };
}

// ============ Custom Assets ============

export async function createCustomAsset(asset: InsertCustomAsset): Promise<CustomAsset> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(customAssets).values(asset);
  
  // Retrieve the most recently inserted asset by this user
  const inserted = await db.select().from(customAssets)
    .where(eq(customAssets.userId, asset.userId))
    .orderBy(customAssets.createdAt)
    .limit(1);
  
  if (!inserted[0]) {
    throw new Error("Failed to retrieve inserted asset");
  }
  
  return inserted[0];
}

export async function getCustomAssetsByUser(userId: number): Promise<CustomAsset[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(customAssets).where(eq(customAssets.userId, userId));
}

export async function getCustomAssetsByProject(projectId: number): Promise<CustomAsset[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(customAssets).where(eq(customAssets.projectId, projectId));
}

export async function deleteCustomAsset(assetId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(customAssets).where(eq(customAssets.id, assetId));
}
