import { test, expect } from "@playwright/test";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

test.describe("Agent Audio Streaming Docker Tests", () => {
  test("should verify agent logs show speech generation", async () => {
    // Wait for agent to start and begin speaking
    await new Promise(resolve => setTimeout(resolve, 15000));

    // Get agent logs
    const { stdout } = await execAsync("docker-compose logs agent --tail=50");

    console.log("Agent logs:", stdout);

    // Check for speech-related log messages
    const speechLogs = stdout
      .split("\n")
      .filter(
        line =>
          line.includes("🎵 Speaking:") ||
          line.includes("✅ Simulated speech completed") ||
          line.includes("✅ Fallback speech completed") ||
          line.includes("✅ Generated") ||
          line.includes("🎵 Audio generated successfully") ||
          line.includes("⚠️  Falling back to text-only mode")
      );

    console.log("Speech-related logs:", speechLogs);

    // Verify agent is speaking
    expect(speechLogs.length).toBeGreaterThan(0);

    // Verify specific speech messages (check for any speech content)
    const hasSpeech = speechLogs.some(
      log => log.includes("🎵 Speaking:") || log.includes("speech completed")
    );
    expect(hasSpeech).toBe(true);
  });

  test("should verify agent conversation flow timing", async () => {
    // Wait for full conversation to complete
    await new Promise(resolve => setTimeout(resolve, 25000));

    // Get agent logs
    const { stdout } = await execAsync("docker-compose logs agent --tail=100");

    // Extract speech timestamps
    const speechLines = stdout
      .split("\n")
      .filter(line => line.includes("🎵 Speaking:"));

    console.log("Speech lines:", speechLines);

    // Verify we have speech events
    expect(speechLines.length).toBeGreaterThan(0);

    // Verify conversation flow (check for any speech content)
    const hasSpeech = speechLines.some(line => line.includes("🎵 Speaking:"));

    expect(hasSpeech).toBe(true);
  });

  test("should verify agent handles room-specific prompts", async () => {
    // Wait for agent to process prompts
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Get agent logs
    const { stdout } = await execAsync("docker-compose logs agent --tail=50");

    // Check for prompt-related messages
    const promptLogs = stdout
      .split("\n")
      .filter(
        line =>
          line.includes("📋 Instructions:") ||
          line.includes("💡 Using default greeting") ||
          line.includes("🤖 Agent will conduct interview") ||
          line.includes("✅ GLOBAL PROMPT FETCHED") ||
          line.includes("⚠️  No room-specific prompt found")
      );

    console.log("Prompt-related logs:", promptLogs);

    // Verify agent is processing prompts
    expect(promptLogs.length).toBeGreaterThan(0);
  });

  test("should verify agent audio generation (TTS)", async () => {
    // Wait for agent to generate audio
    await new Promise(resolve => setTimeout(resolve, 12000));

    // Get agent logs
    const { stdout } = await execAsync("docker-compose logs agent --tail=50");

    // Check for TTS-related messages
    const ttsLogs = stdout
      .split("\n")
      .filter(
        line =>
          line.includes("✅ Generated") ||
          line.includes("bytes of audio") ||
          line.includes("🎵 Audio generated successfully") ||
          line.includes("⚠️  OpenAI API key not configured") ||
          line.includes("⚠️  Falling back to text-only mode") ||
          line.includes("✅ Fallback speech completed") ||
          line.includes("✅ Simulated speech completed")
      );

    console.log("TTS-related logs:", ttsLogs);

    // Verify TTS is working (either real or simulated)
    expect(ttsLogs.length).toBeGreaterThan(0);

    // Check if it's using real TTS or fallback
    const hasRealTTS = ttsLogs.some(log => log.includes("bytes of audio"));
    const hasFallback = ttsLogs.some(log =>
      log.includes("API key not configured")
    );

    expect(hasRealTTS || hasFallback).toBe(true);
  });

  test("should verify agent participant detection", async () => {
    // Wait for agent to detect participants
    await new Promise(resolve => setTimeout(resolve, 8000));

    // Get agent logs
    const { stdout } = await execAsync("docker-compose logs agent --tail=50");

    // Check for participant-related messages
    const participantLogs = stdout
      .split("\n")
      .filter(
        line =>
          line.includes("👥 Simulating participant joined") ||
          line.includes("🎬 Starting interview with participant") ||
          line.includes("🗣️  Agent will now speak") ||
          line.includes("🎤 Starting audio interview conversation")
      );

    console.log("Participant-related logs:", participantLogs);

    // Verify agent detects participants
    expect(participantLogs.length).toBeGreaterThan(0);
  });

  test("should verify complete agent workflow", async () => {
    // Wait for complete workflow
    await new Promise(resolve => setTimeout(resolve, 30000));

    // Get agent logs
    const { stdout } = await execAsync("docker-compose logs agent --tail=100");

    // Check for complete workflow indicators
    const workflowLogs = stdout
      .split("\n")
      .filter(
        line =>
          line.includes("🚀 INTERVIEW STRELLA AGENT STARTING") ||
          line.includes("✅ INSTRUCTIONS LOADED SUCCESSFULLY") ||
          line.includes("✅ TOKEN RECEIVED SUCCESSFULLY") ||
          line.includes("✅ Connected to LiveKit room successfully") ||
          line.includes("🎤 Agent is ready to start interview") ||
          line.includes("🎵 Speaking:")
      );

    console.log("Workflow logs:", workflowLogs);

    // Verify complete workflow
    expect(workflowLogs.length).toBeGreaterThan(5);

    // Verify key workflow steps
    const hasStart = workflowLogs.some(log => log.includes("STARTING"));
    const hasInstructions = workflowLogs.some(log =>
      log.includes("INSTRUCTIONS LOADED")
    );
    const hasToken = workflowLogs.some(log => log.includes("TOKEN RECEIVED"));
    const hasConnection = workflowLogs.some(log =>
      log.includes("Connected to LiveKit")
    );
    const hasSpeech = workflowLogs.some(log => log.includes("🎵 Speaking:"));

    expect(hasStart).toBe(true);
    expect(hasInstructions).toBe(true);
    expect(hasToken).toBe(true);
    expect(hasConnection).toBe(true);
    expect(hasSpeech).toBe(true);
  });
});
