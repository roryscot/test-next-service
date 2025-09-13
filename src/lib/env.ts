// src/lib/env.ts
import { config } from "dotenv";
import { EnvSchema, type EnvT } from "./schemas";

// Load environment variables
config();

// Validate environment variables at boot
function validateEnv(): EnvT {
  try {
    return EnvSchema.parse({
      LIVEKIT_URL: process.env.LIVEKIT_URL,
      LIVEKIT_API_KEY: process.env.LIVEKIT_API_KEY,
      LIVEKIT_API_SECRET: process.env.LIVEKIT_API_SECRET,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      OPENAI_REALTIME_MODEL: process.env.OPENAI_REALTIME_MODEL,
      SERVER_ORIGIN: process.env.SERVER_ORIGIN,
    });
  } catch (error) {
    console.error("❌ Environment validation failed:");
    if (error instanceof Error) {
      console.error(error.message);
    }
    process.exit(1);
  }
}

// Export validated environment
export const env = validateEnv();

// Server-only environment (not exposed to client)
export const serverEnv = {
  LIVEKIT_URL: env.LIVEKIT_URL,
  LIVEKIT_API_KEY: env.LIVEKIT_API_KEY,
  LIVEKIT_API_SECRET: env.LIVEKIT_API_SECRET,
  OPENAI_API_KEY: env.OPENAI_API_KEY,
  OPENAI_REALTIME_MODEL: env.OPENAI_REALTIME_MODEL,
} as const;
