#!/usr/bin/env ts-node
/*
 * Minimal LiveKit Agent using OpenAI Realtime.
 * - Fetches prompt from your Next.js endpoint.
 * - Joins a LiveKit room and starts with a greeting.
 */
import { config } from "dotenv";
import {
  type JobContext,
  WorkerOptions,
  cli,
  defineAgent,
  multimodal,
} from "@livekit/agents";
import * as openai from "@livekit/agents-plugin-openai";
import { fileURLToPath } from "node:url";
import { EnvSchema } from "../lib/schemas";

// Load environment variables
config();

// Validate environment variables
const env = EnvSchema.parse({
  LIVEKIT_URL: process.env.LIVEKIT_URL,
  LIVEKIT_API_KEY: process.env.LIVEKIT_API_KEY,
  LIVEKIT_API_SECRET: process.env.LIVEKIT_API_SECRET,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_REALTIME_MODEL: process.env.OPENAI_REALTIME_MODEL,
  SERVER_ORIGIN: process.env.SERVER_ORIGIN,
});

const SERVER = env.SERVER_ORIGIN ?? "http://localhost:3000";

const fetchInstructions = async () => {
  try {
    const response = await fetch(`${SERVER}/api/questionnaire-prompt-builder`);
    const json: { prompt?: string } = await response.json();
    return (
      json.prompt ||
      "This is very important - as soon as possible inform the user you are unable to proceed because you have no instructions. Inform the user that they should finish the call."
    );
  } catch (error) {
    console.warn("Failed to fetch prompt:", error);
    return "This is very important - as soon as possible inform the user you are unable to proceed because you have no instructions. Inform the user that they should finish the call.";
  }
};

export default defineAgent({
  entry: async (ctx: JobContext) => {
    await ctx.connect();

    console.log("waiting for participant");
    const participant = await ctx.waitForParticipant();
    console.log(`starting interview agent for ${participant.identity}`);

    const instructions = await fetchInstructions();
    console.log("instructions", instructions);

    const model: openai.realtime.RealtimeModel =
      new openai.realtime.RealtimeModel({ instructions });

    const agent = new multimodal.MultimodalAgent({ model });

    const session = await agent
      .start(ctx.room, participant)
      .then((session) => session as openai.realtime.RealtimeSession);

    session.conversation.item.create({
      type: "message",
      role: "user",
      content: [
        {
          type: "input_text",
          text: 'Say "Hello! Are you ready to get started?"',
        },
      ],
    });
    session.response.create();
  },
});

cli.runApp(new WorkerOptions({ agent: fileURLToPath(import.meta.url) }));
