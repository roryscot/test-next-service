// src/lib/schemas.ts
import { z } from "zod";

// Prompt API schemas
export const PromptRequest = z.object({
  prompt: z
    .string()
    .min(10, "Prompt must be at least 10 characters")
    .max(10000, "Prompt must be less than 10,000 characters"),
});

export const PromptResponse = z.object({
  prompt: z.string(),
});

// LiveKit token schemas
export const TokenRequest = z.object({
  roomName: z
    .string()
    .min(1, "Room name is required")
    .max(100, "Room name too long"),
  identity: z
    .string()
    .min(1, "Identity is required")
    .max(100, "Identity too long"),
});

export const TokenResponse = z.object({
  token: z.string(),
});

// LiveKit URL schema
export const LiveKitUrlResponse = z.object({
  url: z.string().url("Invalid WebSocket URL"),
});

// Environment validation schema
export const EnvSchema = z.object({
  LIVEKIT_URL: z.string().url("LIVEKIT_URL must be a valid WebSocket URL"),
  LIVEKIT_API_KEY: z.string().min(1, "LIVEKIT_API_KEY is required"),
  LIVEKIT_API_SECRET: z.string().min(1, "LIVEKIT_API_SECRET is required"),
  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required").optional(),
  OPENAI_REALTIME_MODEL: z.string().optional(),
  SERVER_ORIGIN: z.string().url("SERVER_ORIGIN must be a valid URL").optional(),
});

// Type exports
export type PromptRequestT = z.infer<typeof PromptRequest>;
export type PromptResponseT = z.infer<typeof PromptResponse>;
export type TokenRequestT = z.infer<typeof TokenRequest>;
export type TokenResponseT = z.infer<typeof TokenResponse>;
export type LiveKitUrlResponseT = z.infer<typeof LiveKitUrlResponse>;
export type EnvT = z.infer<typeof EnvSchema>;

// Error response schema
export const ErrorResponse = z.object({
  error: z.string(),
  code: z.string().optional(),
  details: z.record(z.string(), z.unknown()).optional(),
});

export type ErrorResponseT = z.infer<typeof ErrorResponse>;
