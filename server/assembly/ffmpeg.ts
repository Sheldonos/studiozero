/**
 * FFmpeg Assembly System
 * 
 * Combines video shots and audio tracks into final MP4 film
 */

import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, unlink, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { storagePut } from "../storage";

const execAsync = promisify(exec);

interface VideoShot {
  url: string;
  durationSeconds: number;
  order: number;
}

interface AudioTrack {
  url: string;
  type: "dialogue" | "narration" | "music" | "foley";
  startTime: number; // seconds
  volume: number; // 0.0 to 1.0
}

interface AssemblyParams {
  projectId: number;
  shots: VideoShot[];
  audioTracks: AudioTrack[];
  outputFormat: "film_16x9" | "series_16x9" | "vertical_9x16";
  transitions?: boolean;
}

interface AssemblyResult {
  videoUrl: string;
  videoKey: string;
  durationSeconds: number;
  fileSize: number;
}

/**
 * Download file from URL to local temp directory
 */
async function downloadFile(url: string, filename: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.statusText}`);
  }
  
  const buffer = await response.arrayBuffer();
  const tempPath = path.join("/tmp", filename);
  await writeFile(tempPath, Buffer.from(buffer));
  
  return tempPath;
}

/**
 * Get video resolution based on format
 */
function getResolution(format: string): { width: number; height: number } {
  switch (format) {
    case "film_16x9":
    case "series_16x9":
      return { width: 1920, height: 1080 };
    case "vertical_9x16":
      return { width: 1080, height: 1920 };
    default:
      return { width: 1920, height: 1080 };
  }
}

/**
 * Create concat file for FFmpeg
 */
async function createConcatFile(videoPaths: string[]): Promise<string> {
  const concatContent = videoPaths
    .map(p => `file '${p}'`)
    .join("\n");
  
  const concatPath = path.join("/tmp", `concat_${Date.now()}.txt`);
  await writeFile(concatPath, concatContent);
  
  return concatPath;
}

/**
 * Concatenate video shots
 */
async function concatenateVideos(
  videoPaths: string[],
  outputPath: string,
  resolution: { width: number; height: number }
): Promise<void> {
  const concatFile = await createConcatFile(videoPaths);
  
  try {
    // Use concat demuxer for fast concatenation
    // Scale all videos to same resolution and add fade transitions
    const command = `ffmpeg -f concat -safe 0 -i ${concatFile} \
      -vf "scale=${resolution.width}:${resolution.height}:force_original_aspect_ratio=decrease,pad=${resolution.width}:${resolution.height}:(ow-iw)/2:(oh-ih)/2,fade=t=in:st=0:d=0.5,fade=t=out:st=2.5:d=0.5" \
      -c:v libx264 -preset medium -crf 23 \
      -pix_fmt yuv420p \
      -movflags +faststart \
      -y ${outputPath}`;
    
    console.log("[FFmpeg] Concatenating videos...");
    const { stdout, stderr } = await execAsync(command);
    console.log("[FFmpeg] Concatenation complete");
    
    if (stderr && !stderr.includes("frame=")) {
      console.warn("[FFmpeg] Warning:", stderr);
    }
  } finally {
    // Cleanup concat file
    await unlink(concatFile).catch(() => {});
  }
}

/**
 * Mix audio tracks
 */
async function mixAudioTracks(
  audioTracks: { path: string; startTime: number; volume: number }[],
  duration: number,
  outputPath: string
): Promise<void> {
  if (audioTracks.length === 0) {
    console.log("[FFmpeg] No audio tracks to mix");
    return;
  }
  
  // Build FFmpeg command for audio mixing
  const inputs = audioTracks.map((_, i) => `-i ${audioTracks[i]!.path}`).join(" ");
  
  // Create filter complex for mixing with delays and volume adjustments
  const filterParts = audioTracks.map((track, i) => {
    return `[${i}:a]adelay=${track.startTime * 1000}|${track.startTime * 1000},volume=${track.volume}[a${i}]`;
  });
  
  const mixInputs = audioTracks.map((_, i) => `[a${i}]`).join("");
  const filterComplex = `${filterParts.join(";")}; ${mixInputs}amix=inputs=${audioTracks.length}:duration=longest[aout]`;
  
  const command = `ffmpeg ${inputs} \
    -filter_complex "${filterComplex}" \
    -map "[aout]" \
    -t ${duration} \
    -c:a aac -b:a 192k \
    -y ${outputPath}`;
  
  console.log("[FFmpeg] Mixing audio tracks...");
  const { stdout, stderr } = await execAsync(command);
  console.log("[FFmpeg] Audio mixing complete");
  
  if (stderr && !stderr.includes("frame=")) {
    console.warn("[FFmpeg] Warning:", stderr);
  }
}

/**
 * Combine video and audio
 */
async function combineVideoAudio(
  videoPath: string,
  audioPath: string,
  outputPath: string
): Promise<void> {
  const command = `ffmpeg -i ${videoPath} -i ${audioPath} \
    -c:v copy -c:a aac -b:a 192k \
    -map 0:v:0 -map 1:a:0 \
    -shortest \
    -movflags +faststart \
    -y ${outputPath}`;
  
  console.log("[FFmpeg] Combining video and audio...");
  const { stdout, stderr } = await execAsync(command);
  console.log("[FFmpeg] Combination complete");
  
  if (stderr && !stderr.includes("frame=")) {
    console.warn("[FFmpeg] Warning:", stderr);
  }
}

/**
 * Get video duration using ffprobe
 */
async function getVideoDuration(videoPath: string): Promise<number> {
  const command = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 ${videoPath}`;
  const { stdout } = await execAsync(command);
  return parseFloat(stdout.trim());
}

/**
 * Main assembly function
 */
export async function assembleFilm(params: AssemblyParams): Promise<AssemblyResult> {
  console.log(`[Assembly] Starting assembly for project ${params.projectId}`);
  
  const tempDir = `/tmp/assembly_${params.projectId}_${Date.now()}`;
  await mkdir(tempDir, { recursive: true });
  
  try {
    // 1. Download all video shots
    console.log(`[Assembly] Downloading ${params.shots.length} video shots...`);
    const videoFiles: string[] = [];
    
    for (let i = 0; i < params.shots.length; i++) {
      const shot = params.shots[i]!;
      const filename = `shot_${i.toString().padStart(3, "0")}.mp4`;
      const localPath = await downloadFile(shot.url, path.join(tempDir, filename));
      videoFiles.push(localPath);
    }
    
    // 2. Concatenate videos
    const resolution = getResolution(params.outputFormat);
    const concatenatedVideo = path.join(tempDir, "concatenated.mp4");
    await concatenateVideos(videoFiles, concatenatedVideo, resolution);
    
    // Get total duration
    const totalDuration = await getVideoDuration(concatenatedVideo);
    console.log(`[Assembly] Total video duration: ${totalDuration}s`);
    
    // 3. Download and mix audio tracks (if any)
    let finalVideoPath = concatenatedVideo;
    
    if (params.audioTracks.length > 0) {
      console.log(`[Assembly] Downloading ${params.audioTracks.length} audio tracks...`);
      const audioFiles: { path: string; startTime: number; volume: number }[] = [];
      
      for (let i = 0; i < params.audioTracks.length; i++) {
        const track = params.audioTracks[i]!;
        const filename = `audio_${track.type}_${i}.mp3`;
        const localPath = await downloadFile(track.url, path.join(tempDir, filename));
        audioFiles.push({
          path: localPath,
          startTime: track.startTime,
          volume: track.volume
        });
      }
      
      // Mix audio
      const mixedAudio = path.join(tempDir, "mixed_audio.aac");
      await mixAudioTracks(audioFiles, totalDuration, mixedAudio);
      
      // Combine video with mixed audio
      const finalVideo = path.join(tempDir, "final.mp4");
      await combineVideoAudio(concatenatedVideo, mixedAudio, finalVideo);
      finalVideoPath = finalVideo;
    }
    
    // 4. Upload final video to S3
    console.log("[Assembly] Uploading final video to S3...");
    const finalVideoBuffer = await import("fs/promises").then(fs => fs.readFile(finalVideoPath));
    const fileSize = finalVideoBuffer.length;
    
    const videoKey = `projects/${params.projectId}/final_${Date.now()}.mp4`;
    const { url: videoUrl } = await storagePut(videoKey, finalVideoBuffer, "video/mp4");
    
    console.log(`[Assembly] Assembly complete! Video URL: ${videoUrl}`);
    
    return {
      videoUrl,
      videoKey,
      durationSeconds: totalDuration,
      fileSize
    };
    
  } finally {
    // Cleanup temp directory
    console.log("[Assembly] Cleaning up temporary files...");
    await execAsync(`rm -rf ${tempDir}`).catch(err => {
      console.warn("[Assembly] Failed to cleanup temp directory:", err);
    });
  }
}

/**
 * Check if FFmpeg is installed
 */
export async function checkFFmpegInstalled(): Promise<boolean> {
  try {
    await execAsync("ffmpeg -version");
    return true;
  } catch {
    return false;
  }
}
