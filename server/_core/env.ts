export const ENV = {
  // App
  cookieSecret: process.env.JWT_SECRET ?? "change-me-in-production",
  databaseUrl: process.env.DATABASE_URL ?? "",
  isProduction: process.env.NODE_ENV === "production",

  // OpenAI (LLM + Whisper)
  openAiApiKey: process.env.OPENAI_API_KEY ?? "",
  openAiBaseUrl: process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
  openAiModel: process.env.OPENAI_MODEL ?? "gpt-4o",

  // AWS S3 (file storage)
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
  awsRegion: process.env.AWS_REGION ?? "us-east-1",
  awsS3Bucket: process.env.AWS_S3_BUCKET ?? "",

  // Replicate (image/video generation)
  replicateApiToken: process.env.REPLICATE_API_TOKEN ?? "",

  // ElevenLabs (audio/voice)
  elevenLabsApiKey: process.env.ELEVENLABS_API_KEY ?? "",
};
