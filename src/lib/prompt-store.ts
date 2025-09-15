// src/lib/prompt-store.ts
import { promises as fs } from "fs";
import path from "path";
import { PromptRequest } from "./schemas";

const PROMPTS_DIR = path.join(process.cwd(), "data", "prompts");
const PROMPTS_FILE = path.join(PROMPTS_DIR, "prompts.json");

export type PromptRecord = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export class PromptStore {
  static async read(): Promise<PromptRecord[]> {
    try {
      const buf = await fs.readFile(PROMPTS_FILE, "utf8");
      const json = JSON.parse(buf);
      if (Array.isArray(json)) return json;
    } catch {}

    // Return default prompt if no prompts exist
    return [
      {
        id: "default",
        title: "Default Interview Prompt",
        content: defaultPrompt,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }

  static async write(data: PromptRequest): Promise<void> {
    // Validate input using Zod schema
    const validated = PromptRequest.parse(data);

    // Sanitize prompt content
    const sanitizedPrompt = this.sanitizePrompt(validated.prompt);
    const title = validated.title || "Untitled Prompt";

    // Generate ID and timestamps
    const id = `prompt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();

    const newPrompt: PromptRecord = {
      id,
      title,
      content: sanitizedPrompt,
      createdAt: now,
      updatedAt: now,
    };

    // Read existing prompts
    const existingPrompts = await this.read();

    // Add new prompt
    const updatedPrompts = [...existingPrompts, newPrompt];

    // Ensure directory exists
    await fs.mkdir(PROMPTS_DIR, { recursive: true });

    // Write updated prompts
    await fs.writeFile(
      PROMPTS_FILE,
      JSON.stringify(updatedPrompts, null, 2),
      "utf8"
    );
  }

  static async update(id: string, data: PromptRequest): Promise<void> {
    const validated = PromptRequest.parse(data);
    const sanitizedPrompt = this.sanitizePrompt(validated.prompt);
    const title = validated.title || "Untitled Prompt";

    const existingPrompts = await this.read();
    const promptIndex = existingPrompts.findIndex(p => p.id === id);

    if (promptIndex === -1) {
      throw new Error(`Prompt with id ${id} not found`);
    }

    // Update the prompt
    existingPrompts[promptIndex] = {
      ...existingPrompts[promptIndex],
      title,
      content: sanitizedPrompt,
      updatedAt: new Date().toISOString(),
    };

    await fs.writeFile(
      PROMPTS_FILE,
      JSON.stringify(existingPrompts, null, 2),
      "utf8"
    );
  }

  static async delete(id: string): Promise<void> {
    const existingPrompts = await this.read();
    const filteredPrompts = existingPrompts.filter(p => p.id !== id);

    if (filteredPrompts.length === existingPrompts.length) {
      throw new Error(`Prompt with id ${id} not found`);
    }

    await fs.writeFile(
      PROMPTS_FILE,
      JSON.stringify(filteredPrompts, null, 2),
      "utf8"
    );
  }

  // Room-specific prompt methods (keeping for backward compatibility)
  static async getRoomPrompt(roomName: string): Promise<string | null> {
    try {
      const roomFile = path.join(
        process.cwd(),
        "data",
        "rooms",
        `${roomName}.json`
      );
      const buf = await fs.readFile(roomFile, "utf8");
      const json = JSON.parse(buf);
      if (typeof json?.prompt === "string") return json.prompt;
    } catch {}
    return null;
  }

  static async saveRoomPrompt(roomName: string, prompt: string): Promise<void> {
    // Sanitize prompt content
    const sanitizedPrompt = this.sanitizePrompt(prompt);

    const roomFile = path.join(
      process.cwd(),
      "data",
      "rooms",
      `${roomName}.json`
    );
    await fs.mkdir(path.dirname(roomFile), { recursive: true });
    await fs.writeFile(
      roomFile,
      JSON.stringify(
        {
          roomName,
          prompt: sanitizedPrompt,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        null,
        2
      ),
      "utf8"
    );
  }

  private static sanitizePrompt(prompt: string): string {
    return (
      prompt
        // Remove script tags and other potentially dangerous HTML
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
        .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
        .replace(/<embed\b[^<]*>/gi, "")
        .replace(/<link\b[^<]*>/gi, "")
        .replace(/<meta\b[^<]*>/gi, "")
        // Remove javascript: and data: URLs
        .replace(/javascript:/gi, "")
        .replace(/data:text\/html/gi, "")
        // Normalize whitespace
        .replace(/\s+/g, " ")
        .trim()
    );
  }
}

export const defaultPrompt = `Interview Instructions (Default)

You are a friendly, concise interviewer.
- Start with: "Hello! Are you ready to get started?"
- Ask one question at a time.
- Ask follow-ups only when useful.
- Be encouraging and keep answers short.
- Close by thanking the participant and summarizing key points.`;
