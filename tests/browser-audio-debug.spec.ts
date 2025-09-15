import { test } from "@playwright/test";

test.describe("Browser Audio Debugging", () => {
  test("should debug audio streaming from agent to browser", async ({
    page,
  }) => {
    // Navigate to the call page
    await page.goto("http://localhost:3000/call");

    // Fill in room details
    await page.fill('input[placeholder="Enter your name"]', "test-participant");

    // Wait for questionnaires to load by checking if select has options
    await page.waitForFunction(
      () => {
        const select = document.querySelector("select");
        return select && select.options.length > 0;
      },
      { timeout: 10000 }
    );

    // Select global prompt
    await page.selectOption("select", "global");

    // Click connect button
    await page.click('button:has-text("Start Interview")');

    // Wait for connection to establish
    await page.waitForSelector('button:has-text("Disconnect")', {
      timeout: 15000,
    });

    console.log("✅ Connected to room successfully");

    // Wait for agent to join and start speaking
    await page.waitForTimeout(10000);

    // Check if agent participant is visible
    const agentParticipant = page.locator('[data-testid="participant-agent"]');
    const isAgentVisible = await agentParticipant.isVisible();

    console.log(`Agent participant visible: ${isAgentVisible}`);

    // Check for audio elements
    const audioElements = await page.locator("audio").count();
    console.log(`Audio elements found: ${audioElements}`);

    // Check for WebSocket connections
    const wsConnections = await page.evaluate(() => {
      return window.WebSocket ? "WebSocket available" : "No WebSocket";
    });
    console.log(`WebSocket status: ${wsConnections}`);

    // Check for LiveKit room connection
    const roomStatus = await page.evaluate(() => {
      // Check if LiveKit room is connected
      return window.room ? "Room connected" : "No room connection";
    });
    console.log(`Room status: ${roomStatus}`);

    // Check for audio tracks
    const audioTracks = await page.evaluate(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const tracks = stream.getAudioTracks();
        return tracks.length;
      } catch (error) {
        return `Error: ${error.message}`;
      }
    });
    console.log(`Audio tracks: ${audioTracks}`);

    // Check for agent audio specifically
    const agentAudio = await page.evaluate(() => {
      // Look for any audio elements that might be playing agent speech
      const audioElements = document.querySelectorAll("audio");
      let agentAudioFound = false;

      audioElements.forEach(audio => {
        if (audio.src && audio.src.includes("agent")) {
          agentAudioFound = true;
        }
      });

      return agentAudioFound ? "Agent audio found" : "No agent audio";
    });
    console.log(`Agent audio status: ${agentAudio}`);

    // Take a screenshot for debugging
    await page.screenshot({ path: "audio-debug.png" });
    console.log("📸 Screenshot saved as audio-debug.png");

    // Check console logs for any audio-related errors
    const consoleLogs = await page.evaluate(() => {
      return window.console ? "Console available" : "No console";
    });
    console.log(`Console status: ${consoleLogs}`);

    console.log(
      "🔍 Audio debugging complete - check the logs above for issues"
    );
  });

  test("should test LiveKit room connection and audio", async ({ page }) => {
    // Navigate to the call page
    await page.goto("http://localhost:3000/call");

    // Fill in room details
    await page.fill('input[placeholder="Enter your name"]', "test-participant");

    // Wait for questionnaires to load by checking if select has options
    await page.waitForFunction(
      () => {
        const select = document.querySelector("select");
        return select && select.options.length > 0;
      },
      { timeout: 10000 }
    );

    // Select global prompt
    await page.selectOption("select", "global");

    // Click connect button
    await page.click('button:has-text("Start Interview")');

    // Wait for connection
    await page.waitForSelector('button:has-text("Disconnect")', {
      timeout: 15000,
    });

    // Check LiveKit connection status
    const livekitStatus = await page.evaluate(() => {
      // Check if LiveKit is loaded and connected
      if (window.livekit) {
        return "LiveKit loaded";
      } else if (window.Room) {
        return "Room class available";
      } else {
        return "LiveKit not loaded";
      }
    });
    console.log(`LiveKit status: ${livekitStatus}`);

    // Check for any error messages
    const errorMessages = await page.evaluate(() => {
      const errors = [];
      const errorElements = document.querySelectorAll(
        '[class*="error"], [class*="Error"]'
      );
      errorElements.forEach(el => {
        if (el.textContent) {
          errors.push(el.textContent);
        }
      });
      return errors;
    });
    console.log(`Error messages: ${errorMessages}`);

    // Wait for agent to potentially join
    await page.waitForTimeout(15000);

    // Check if agent joined
    const agentJoined = await page.evaluate(() => {
      // Look for any indication that an agent joined
      const participants = document.querySelectorAll(
        '[data-testid*="participant"]'
      );
      return participants.length > 1; // More than just the user
    });
    console.log(`Agent joined: ${agentJoined}`);

    console.log("🔍 LiveKit debugging complete");
  });
});
