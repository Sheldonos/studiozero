import Replicate from "replicate";

// Initialize Replicate client
// Note: API key will be provided via environment variable REPLICATE_API_TOKEN
let replicateClient: Replicate | null = null;

function getReplicateClient(): Replicate {
  if (!replicateClient) {
    const apiToken = process.env.REPLICATE_API_TOKEN;
    if (!apiToken) {
      throw new Error("REPLICATE_API_TOKEN environment variable is not set");
    }
    replicateClient = new Replicate({ auth: apiToken });
  }
  return replicateClient;
}

export interface ImageGenerationParams {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  seed?: number;
  numInferenceSteps?: number;
  guidanceScale?: number;
}

export interface VideoGenerationParams {
  imageUrl: string;
  motionPrompt: string;
  duration?: number;
}

export interface GenerationResult {
  id: string;
  status: string;
  output?: string | string[];
  error?: string;
}

/**
 * Generate an image using Stable Diffusion XL via Replicate
 */
export async function generateImage(params: ImageGenerationParams): Promise<GenerationResult> {
  console.log("[Replicate] Starting image generation...");
  
  try {
    const client = getReplicateClient();
    
    const prediction = await client.predictions.create({
      version: "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b", // SDXL
      input: {
        prompt: params.prompt,
        negative_prompt: params.negativePrompt || "low quality, blurry, distorted, deformed, ugly, bad anatomy, bad proportions, watermark, text",
        width: params.width || 1024,
        height: params.height || 576,
        num_outputs: 1,
        scheduler: "K_EULER",
        num_inference_steps: params.numInferenceSteps || 50,
        guidance_scale: params.guidanceScale || 7.5,
        seed: params.seed,
      },
    });

    console.log(`[Replicate] Image generation started: ${prediction.id}`);
    
    return {
      id: prediction.id,
      status: prediction.status,
      output: prediction.output,
      error: prediction.error as string | undefined,
    };
  } catch (error) {
    console.error("[Replicate] Image generation error:", error);
    throw new Error(`Image generation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate a video from an image using image-to-video model
 */
export async function generateVideo(params: VideoGenerationParams): Promise<GenerationResult> {
  console.log("[Replicate] Starting video generation...");
  
  try {
    const client = getReplicateClient();
    
    // Using a generic image-to-video model
    // Note: Replace with actual Kling or WAN model version when available
    const prediction = await client.predictions.create({
      version: "9f747673945c62801b13b84701c783929c0ee784e4748ec062204894dda1a351", // stable-video-diffusion
      input: {
        input_image: params.imageUrl,
        motion_bucket_id: 127, // Controls motion amount
        fps: 6,
        cond_aug: 0.02,
      },
    });

    console.log(`[Replicate] Video generation started: ${prediction.id}`);
    
    return {
      id: prediction.id,
      status: prediction.status,
      output: prediction.output,
      error: prediction.error as string | undefined,
    };
  } catch (error) {
    console.error("[Replicate] Video generation error:", error);
    throw new Error(`Video generation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get the status of a prediction
 */
export async function getPredictionStatus(predictionId: string): Promise<GenerationResult> {
  try {
    const client = getReplicateClient();
    const prediction = await client.predictions.get(predictionId);
    
    return {
      id: prediction.id,
      status: prediction.status,
      output: prediction.output,
      error: prediction.error as string | undefined,
    };
  } catch (error) {
    console.error("[Replicate] Error getting prediction status:", error);
    throw new Error(`Failed to get prediction status: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Wait for a prediction to complete (with timeout)
 */
export async function waitForPrediction(
  predictionId: string, 
  timeoutMs: number = 300000, // 5 minutes default
  pollIntervalMs: number = 2000
): Promise<GenerationResult> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    const result = await getPredictionStatus(predictionId);
    
    if (result.status === "succeeded") {
      console.log(`[Replicate] Prediction ${predictionId} succeeded`);
      return result;
    }
    
    if (result.status === "failed" || result.status === "canceled") {
      console.error(`[Replicate] Prediction ${predictionId} ${result.status}: ${result.error}`);
      throw new Error(`Prediction ${result.status}: ${result.error}`);
    }
    
    // Still processing, wait and retry
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  }
  
  throw new Error(`Prediction ${predictionId} timed out after ${timeoutMs}ms`);
}

/**
 * Generate image and wait for completion
 */
export async function generateImageSync(params: ImageGenerationParams): Promise<string> {
  const prediction = await generateImage(params);
  const result = await waitForPrediction(prediction.id);
  
  if (!result.output) {
    throw new Error("No output from image generation");
  }
  
  const outputUrl = Array.isArray(result.output) ? result.output[0] : result.output;
  if (!outputUrl) {
    throw new Error("Invalid output from image generation");
  }
  
  return outputUrl;
}

/**
 * Generate video and wait for completion
 */
export async function generateVideoSync(params: VideoGenerationParams): Promise<string> {
  const prediction = await generateVideo(params);
  const result = await waitForPrediction(prediction.id, 600000); // 10 minutes for video
  
  if (!result.output) {
    throw new Error("No output from video generation");
  }
  
  const outputUrl = Array.isArray(result.output) ? result.output[0] : result.output;
  if (!outputUrl) {
    throw new Error("Invalid output from video generation");
  }
  
  return outputUrl;
}

/**
 * Estimate cost for image generation (approximate)
 */
export function estimateImageCost(): number {
  return 2; // ~$0.02 per image in cents
}

/**
 * Estimate cost for video generation (approximate)
 */
export function estimateVideoCost(): number {
  return 15; // ~$0.15 per video in cents
}
