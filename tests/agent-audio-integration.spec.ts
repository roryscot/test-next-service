import { test, expect } from "@playwright/test";

test.describe("Agent Audio Streaming Integration Tests", () => {
  test("should verify agent logs show speech generation", async ({ page }) => {
    // Start monitoring agent logs
    // const _agentLogs = [];

    // Mock console.log to capture agent speech logs
    await page.addInitScript(() => {
      const originalLog = console.log;
      console.log = (...args) => {
        if (args[0] && args[0].includes("🎵 Speaking:")) {
          window.agentSpeechLogs = window.agentSpeechLogs || [];
          window.agentSpeechLogs.push(args[0]);
        }
        originalLog.apply(console, args);
      };
    });

    // Navigate to call page
    await page.goto("http://localhost:3000/call");

    // Fill in room details
    await page.fill('input[placeholder="Enter room name"]', "log-test-room");
    await page.fill('input[placeholder="Enter your name"]', "test-participant");

    // Select global prompt
    await page.selectOption("select", "global");

    // Click connect button
    await page.click('button:has-text("Connect to Room")');

    // Wait for connection
    await page.waitForSelector('[data-testid="room-connected"]', {
      timeout: 10000,
    });

    // Wait for agent to start speaking
    await page.waitForTimeout(10000);

    // Check if agent speech logs were captured
    const speechLogs = await page.evaluate(() => window.agentSpeechLogs || []);

    console.log("Agent speech logs:", speechLogs);

    // Verify agent started speaking
    expect(speechLogs.length).toBeGreaterThan(0);
    expect(speechLogs[0]).toContain("🎵 Speaking:");
  });

  test("should verify agent WebSocket communication", async ({ page }) => {
    // Monitor WebSocket messages
    // const wsMessages = [];

    await page.addInitScript(() => {
      const originalWebSocket = window.WebSocket;
      window.WebSocket = class extends originalWebSocket {
        constructor(url, protocols) {
          super(url, protocols);
          this.addEventListener("message", event => {
            window.wsMessages = window.wsMessages || [];
            window.wsMessages.push(event.data);
          });
        }
      };
    });

    // Navigate to call page
    await page.goto("http://localhost:3000/call");

    // Fill in room details
    await page.fill('input[placeholder="Enter room name"]', "ws-test-room");
    await page.fill('input[placeholder="Enter your name"]', "test-participant");

    // Select global prompt
    await page.selectOption("select", "global");

    // Click connect button
    await page.click('button:has-text("Connect to Room")');

    // Wait for connection
    await page.waitForSelector('[data-testid="room-connected"]', {
      timeout: 10000,
    });

    // Wait for WebSocket communication
    await page.waitForTimeout(5000);

    // Check WebSocket messages
    const messages = await page.evaluate(() => window.wsMessages || []);

    console.log("WebSocket messages:", messages);

    // Verify WebSocket communication is happening
    expect(messages.length).toBeGreaterThan(0);
  });

  test("should verify agent audio track is published", async ({ page }) => {
    // Monitor audio tracks
    // const audioTracks = [];

    await page.addInitScript(() => {
      // Mock MediaStreamTrack to capture audio tracks
      const originalGetTracks = MediaStream.prototype.getTracks;
      MediaStream.prototype.getTracks = function () {
        const tracks = originalGetTracks.call(this);
        tracks.forEach(track => {
          if (track.kind === "audio") {
            window.audioTracks = window.audioTracks || [];
            window.audioTracks.push(track);
          }
        });
        return tracks;
      };
    });

    // Navigate to call page
    await page.goto("http://localhost:3000/call");

    // Fill in room details
    await page.fill('input[placeholder="Enter room name"]', "audio-track-room");
    await page.fill('input[placeholder="Enter your name"]', "test-participant");

    // Select global prompt
    await page.selectOption("select", "global");

    // Click connect button
    await page.click('button:has-text("Connect to Room")');

    // Wait for connection
    await page.waitForSelector('[data-testid="room-connected"]', {
      timeout: 10000,
    });

    // Wait for audio tracks to be established
    await page.waitForTimeout(8000);

    // Check audio tracks
    const tracks = await page.evaluate(() => window.audioTracks || []);

    console.log("Audio tracks:", tracks);

    // Verify audio tracks are present
    expect(tracks.length).toBeGreaterThan(0);
  });

  test("should verify agent speech timing matches expected flow", async ({
    page,
  }) => {
    // const speechTimestamps = [];

    await page.addInitScript(() => {
      const originalLog = console.log;
      console.log = (...args) => {
        if (args[0] && args[0].includes("🎵 Speaking:")) {
          window.speechTimestamps = window.speechTimestamps || [];
          window.speechTimestamps.push({
            text: args[0],
            timestamp: Date.now(),
          });
        }
        originalLog.apply(console, args);
      };
    });

    // Navigate to call page
    await page.goto("http://localhost:3000/call");

    // Fill in room details
    await page.fill('input[placeholder="Enter room name"]', "timing-test-room");
    await page.fill('input[placeholder="Enter your name"]', "test-participant");

    // Select global prompt
    await page.selectOption("select", "global");

    // Click connect button
    await page.click('button:has-text("Connect to Room")');

    // Wait for connection
    await page.waitForSelector('[data-testid="room-connected"]', {
      timeout: 10000,
    });

    // Wait for full conversation (20 seconds)
    await page.waitForTimeout(20000);

    // Check speech timestamps
    const timestamps = await page.evaluate(() => window.speechTimestamps || []);

    console.log("Speech timestamps:", timestamps);

    // Verify we have multiple speech events
    expect(timestamps.length).toBeGreaterThanOrEqual(4);

    // Verify timing between speeches (should be ~5 seconds apart)
    for (let i = 1; i < timestamps.length; i++) {
      const timeDiff = timestamps[i].timestamp - timestamps[i - 1].timestamp;
      expect(timeDiff).toBeGreaterThan(4000); // At least 4 seconds
      expect(timeDiff).toBeLessThan(6000); // At most 6 seconds
    }
  });

  test("should verify agent handles different prompt types correctly", async ({
    page,
  }) => {
    // const speechContent = [];

    await page.addInitScript(() => {
      const originalLog = console.log;
      console.log = (...args) => {
        if (args[0] && args[0].includes("🎵 Speaking:")) {
          window.speechContent = window.speechContent || [];
          window.speechContent.push(args[0]);
        }
        originalLog.apply(console, args);
      };
    });

    // Navigate to call page
    await page.goto("http://localhost:3000/call");

    // Fill in room details
    await page.fill('input[placeholder="Enter room name"]', "prompt-type-room");
    await page.fill('input[placeholder="Enter your name"]', "test-participant");

    // Select global prompt
    await page.selectOption("select", "global");

    // Click connect button
    await page.click('button:has-text("Connect to Room")');

    // Wait for connection
    await page.waitForSelector('[data-testid="room-connected"]', {
      timeout: 10000,
    });

    // Wait for agent to start speaking
    await page.waitForTimeout(15000);

    // Check speech content
    const content = await page.evaluate(() => window.speechContent || []);

    console.log("Speech content:", content);

    // Verify agent is speaking
    expect(content.length).toBeGreaterThan(0);

    // Verify first message is the greeting
    expect(content[0]).toContain("Hello! Are you ready to get started?");
  });
});
