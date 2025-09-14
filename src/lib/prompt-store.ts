// src/lib/prompt-store.ts
import { promises as fs } from "fs";
import path from "path";
import { PromptRequest } from "./schemas";

const FILE = path.join(process.cwd(), "data", "prompt.json");

export type PromptRecord = { prompt: string };

export class PromptStore {
  static async read(): Promise<PromptRecord> {
    try {
      const buf = await fs.readFile(FILE, "utf8");
      const json = JSON.parse(buf);
      if (typeof json?.prompt === "string") return { prompt: json.prompt };
    } catch {}
    return { prompt: defaultPrompt };
  }

  static async write(data: PromptRecord): Promise<void> {
    // Validate input using Zod schema
    const validated = PromptRequest.parse(data);

    // Sanitize prompt content
    const sanitizedPrompt = this.sanitizePrompt(validated.prompt);

    await fs.mkdir(path.dirname(FILE), { recursive: true });
    await fs.writeFile(
      FILE,
      JSON.stringify({ prompt: sanitizedPrompt }, null, 2),
      "utf8"
    );
  }

  // Room-specific prompt methods
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
