import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("assets router", () => {
  it("should upload custom asset successfully", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a simple base64 image (1x1 red pixel PNG)
    const base64Image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==";

    const result = await caller.assets.upload({
      assetType: "character_reference",
      assetName: "Test Character",
      assetData: base64Image,
      description: "A test character reference",
      tags: ["test", "character"],
    });

    expect(result).toBeDefined();
    expect(result.assetName).toBe("Test Character");
    expect(result.assetType).toBe("character_reference");
    expect(result.userId).toBe(ctx.user.id);
    expect(result.assetUrl).toBeTruthy();
  });

  it("should list user assets", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const assets = await caller.assets.list();

    expect(Array.isArray(assets)).toBe(true);
    // Assets may or may not exist depending on previous tests
  });

  it("should delete asset", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // First create an asset
    const base64Image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==";
    
    const asset = await caller.assets.upload({
      assetType: "prop",
      assetName: "Test Prop to Delete",
      assetData: base64Image,
    });

    // Then delete it
    const result = await caller.assets.delete({ id: asset.id });

    expect(result.success).toBe(true);
  });

  it("should handle different asset types", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const base64Image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==";

    const assetTypes = ["character_reference", "location_reference", "style_reference", "prop"] as const;

    const results = [];
    for (const assetType of assetTypes) {
      const result = await caller.assets.upload({
        assetType,
        assetName: `Test ${assetType}`,
        assetData: base64Image,
      });
      results.push(result);
    }

    // Verify all assets were created with correct types
    expect(results.length).toBe(4);
    expect(results.some(r => r.assetType === "character_reference")).toBe(true);
    expect(results.some(r => r.assetType === "location_reference")).toBe(true);
    expect(results.some(r => r.assetType === "style_reference")).toBe(true);
    expect(results.some(r => r.assetType === "prop")).toBe(true);
  });
});
