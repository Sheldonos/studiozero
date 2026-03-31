import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "email",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("Project tRPC Procedures", () => {
  it("should list projects for authenticated user", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const projects = await caller.projects.list();

    expect(projects).toBeDefined();
    expect(Array.isArray(projects)).toBe(true);
  });

  it("should get project by ID", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // First create a project
    const project = await caller.projects.create({
      sourceTitle: "Test Project",
      sourceType: "book",
      sourceText: "This is a test story about a hero who goes on an adventure. " +
        "The hero meets many characters along the way and faces many challenges. " +
        "In the end, the hero succeeds and returns home victorious. " +
        "This story teaches us about courage and perseverance.",
      format: "film_16x9",
      stylePreset: "rocky_70s_grit",
      targetRuntimeMinutes: 10,
      language: "en",
    });

    expect(project).toBeDefined();
    expect(project.id).toBeGreaterThan(0);

    // Then retrieve it
    const retrieved = await caller.projects.get({ id: project.id });

    expect(retrieved).toBeDefined();
    expect(retrieved.id).toBe(project.id);
    expect(retrieved.sourceTitle).toBe("Test Project");
  });

  it("should get project details with scenes and stats", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Create a project
    const project = await caller.projects.create({
      sourceTitle: "Detailed Test Project",
      sourceType: "book",
      sourceText: "This is a longer test story with multiple chapters. " +
        "Chapter one introduces the main character, a brave knight. " +
        "Chapter two shows the knight preparing for battle. " +
        "Chapter three depicts the epic battle scene. " +
        "Chapter four shows the knight returning home victorious. " +
        "The story has clear emotional beats and character development.",
      format: "film_16x9",
      stylePreset: "a24_drama",
      targetRuntimeMinutes: 10,
      language: "en",
    });

    // Get details (note: processing happens asynchronously)
    const details = await caller.projects.getDetails({ id: project.id });

    expect(details).toBeDefined();
    expect(details.project).toBeDefined();
    expect(details.stats).toBeDefined();
    expect(details.stats.totalScenes).toBeGreaterThanOrEqual(0);
    expect(details.stats.totalShots).toBeGreaterThanOrEqual(0);
  });

  it("should get project stats", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Create a project
    const project = await caller.projects.create({
      sourceTitle: "Stats Test Project",
      sourceType: "script",
      sourceText: "A simple script about a character's journey. " +
        "The character starts in one place and ends in another. " +
        "Along the way, they learn important lessons about life. " +
        "The script has clear beginning, middle, and end.",
      format: "vertical_9x16",
      stylePreset: "pixar_like",
      targetRuntimeMinutes: 5,
      language: "en",
    });

    const stats = await caller.projects.getStats({ id: project.id });

    expect(stats).toBeDefined();
    expect(typeof stats.totalScenes).toBe("number");
    expect(typeof stats.totalShots).toBe("number");
    expect(typeof stats.completedShots).toBe("number");
    expect(typeof stats.failedShots).toBe("number");
    expect(typeof stats.totalCost).toBe("number");
  });

  it("should enforce minimum source text length", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.projects.create({
        sourceTitle: "Too Short",
        sourceType: "book",
        sourceText: "Too short", // Less than 100 characters
        format: "film_16x9",
        stylePreset: "rocky_70s_grit",
        targetRuntimeMinutes: 10,
        language: "en",
      })
    ).rejects.toThrow();
  });
});

describe("Auth Procedures", () => {
  it("should return current user for authenticated context", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const user = await caller.auth.me();

    expect(user).toBeDefined();
    expect(user?.id).toBe(1);
    expect(user?.email).toBe("test@example.com");
  });

  it("should return null for unauthenticated context", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {
        clearCookie: () => {},
      } as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);
    const user = await caller.auth.me();

    expect(user).toBeNull();
  });
});
