// src/lib/prompt-store.ts
import { promises as fs } from "fs";
import path from "path";
import { PromptRequest } from "./schemas";
import type { z } from "zod";

type PromptRequestType = z.infer<typeof PromptRequest>;

const PROMPTS_DIR = path.join(process.cwd(), "data", "prompts");
const PROMPTS_FILE = path.join(PROMPTS_DIR, "current-prompt.json");

export type PromptRecord = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export class PromptStore {
  static async read(): Promise<PromptRecord> {
    try {
      const buf = await fs.readFile(PROMPTS_FILE, "utf8");
      const json = JSON.parse(buf);
      return json;
    } catch {}

    // Return default prompt if no prompt exists
    return {
      id: "current",
      title: "Current Interview Prompt",
      content: defaultPrompt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  static async write(data: PromptRequestType): Promise<PromptRecord> {
    await fs.mkdir(PROMPTS_DIR, { recursive: true });

    const prompt: PromptRecord = {
      id: "current",
      title: data.title || "Current Interview Prompt",
      content: data.prompt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await fs.writeFile(PROMPTS_FILE, JSON.stringify(prompt, null, 2));
    return prompt;
  }
}

const defaultPrompt = `You are a friendly AI interviewer conducting an interview.

Start with: "Hello! Welcome to the interview. How are you doing today?"

Then ask these questions:
1. "Can you tell me a bit about yourself?"
2. "What interests you most about this role?"
3. "Do you have any questions for me?"

Be conversational and encouraging throughout the interview.`;
