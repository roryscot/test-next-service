import { test, expect } from "@playwright/test";

test.describe("API Endpoints", () => {
  test("should fetch prompt from API", async ({ request }) => {
    const response = await request.get(
      "http://localhost:3000/api/questionnaire-prompt-builder"
    );

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("prompt");
    expect(typeof data.prompt).toBe("string");
  });

  test("should save prompt via API", async ({ request }) => {
    const testPrompt = "Test prompt for API testing";

    const response = await request.post(
      "http://localhost:3000/api/questionnaire-prompt-builder",
      {
        data: { prompt: testPrompt },
      }
    );

    expect(response.status()).toBe(204);

    // Verify the prompt was saved
    const getResponse = await request.get(
      "http://localhost:3000/api/questionnaire-prompt-builder"
    );
    const data = await getResponse.json();
    expect(data.prompt).toBe(testPrompt);
  });

  test("should generate LiveKit token", async ({ request }) => {
    const response = await request.post(
      "http://localhost:3000/api/livekit/token",
      {
        data: {
          roomName: "test-room",
          identity: "test-user",
        },
      }
    );

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("token");
    expect(typeof data.token).toBe("string");
    expect(data.token.length).toBeGreaterThan(0);
  });

  test("should validate token request", async ({ request }) => {
    const response = await request.post(
      "http://localhost:3000/api/livekit/token",
      {
        data: {
          // Missing required fields
        },
      }
    );

    expect(response.status()).toBe(500); // Should return error for invalid request
  });
});
