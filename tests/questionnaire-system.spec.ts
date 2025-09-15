import { test, expect } from "@playwright/test";

test.describe("Questionnaire System Tests", () => {
  test("should create and use custom questionnaire", async ({ page }) => {
    // Step 1: Create a custom questionnaire
    await page.goto("/questionnaire-prompt-builder");

    const customQuestionnaire = `You are a friendly AI interviewer conducting a Strella interview process.

Start with: "Hello Robert or Lydia! Welcome to the Strella interview process."

Wait for their response, then ask these questions about next steps:

1. "What are your thoughts on the next steps in the Strella interview process?"
2. "How do you see yourself contributing to our team?"
3. "What questions do you have about the role and our company?"

Be conversational and encouraging throughout the interview.`;

    // Clear and fill the textarea with our custom questionnaire
    await page.locator("textarea").fill(customQuestionnaire);

    // Click save button
    await page.locator('button:has-text("Save")').click();

    // Wait for success confirmation
    await expect(
      page.locator("[data-sonner-toast], .sonner-toast")
    ).toBeVisible({ timeout: 10000 });

    // Step 2: Navigate to call page and verify questionnaire is available
    await page.goto("/call");

    // Wait for questionnaires to load
    await page.waitForSelector("select", { timeout: 10000 });
    await page.waitForLoadState("networkidle");

    // Check that questionnaires are loaded
    const questionnaireSelect = page.locator("select");
    await expect(questionnaireSelect).toBeVisible();

    // Verify we have questionnaire options
    const options = await questionnaireSelect.locator("option").all();
    expect(options.length).toBeGreaterThan(0);

    // Check that we have the Strella interview questionnaire
    const optionTexts = await Promise.all(
      options.map(option => option.textContent())
    );
    expect(optionTexts).toContain("Strella Interview Process");

    // Select the Strella questionnaire
    await questionnaireSelect.selectOption("Strella Interview Process");

    // Verify the selection worked
    const selectedValue = await questionnaireSelect.inputValue();
    expect(selectedValue).toBe("strella-interview");

    // Step 3: Test that the questionnaire is passed to the agent API
    // We'll intercept the agent API call to verify questionnaire data is sent
    let agentRequestData: Record<string, unknown> | null = null;

    page.on("request", request => {
      if (request.url().includes("/api/agent") && request.method() === "POST") {
        agentRequestData = request.postDataJSON();
      }
    });

    // Fill in room and name
    await page
      .locator('input[placeholder*="room"], input[placeholder*="Room"]')
      .fill("test-room-playwright");
    await page.locator('input[placeholder="Enter your name"]').fill("Robert");

    // Click start interview button
    await page.locator('button:has-text("Start AI Interview")').click();

    // Wait a moment for the request to be made
    await page.waitForTimeout(2000);

    // Verify that the agent API was called with questionnaire data
    expect(agentRequestData).not.toBeNull();
    expect(agentRequestData.action).toBe("start");
    expect(agentRequestData.questionnaireId).toBe("strella-interview");
    expect(agentRequestData.questionnaireContent).toContain(
      "Hello Robert or Lydia"
    );
    expect(agentRequestData.questionnaireContent).toContain(
      "Strella interview process"
    );
  });

  test("should test questionnaire API endpoints", async ({ page }) => {
    // Test the questionnaires API
    const response = await page.request.get("/api/questionnaires");
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.questionnaires).toBeDefined();
    expect(Array.isArray(data.questionnaires)).toBeTruthy();
    expect(data.questionnaires.length).toBeGreaterThan(0);

    // Verify questionnaire structure
    const questionnaire = data.questionnaires[0];
    expect(questionnaire.id).toBeDefined();
    expect(questionnaire.name).toBeDefined();
    expect(questionnaire.content).toBeDefined();
    expect(questionnaire.createdAt).toBeDefined();
    expect(questionnaire.updatedAt).toBeDefined();

    // Check that we have the Strella interview questionnaire
    const strellaQuestionnaire = data.questionnaires.find(
      (q: { id: string }) => q.id === "strella-interview"
    );
    expect(strellaQuestionnaire).toBeDefined();
    expect(strellaQuestionnaire.name).toBe("Strella Interview Process");
    expect(strellaQuestionnaire.content).toContain("Hello Robert or Lydia");
  });

  test("should test agent API with questionnaire data", async ({ page }) => {
    // First stop any existing agent
    await page.request.post("/api/agent", {
      data: { action: "stop" },
    });

    // Test starting agent with questionnaire
    const agentResponse = await page.request.post("/api/agent", {
      data: {
        roomName: "test-room-api",
        action: "start",
        questionnaireId: "strella-interview",
        questionnaireContent: "Test questionnaire content for API testing",
      },
    });

    expect(agentResponse.ok()).toBeTruthy();

    const agentData = await agentResponse.json();
    expect(agentData.message).toContain("Agent started successfully");
    expect(agentData.isActive).toBeTruthy();

    // Test stopping the agent
    const stopResponse = await page.request.post("/api/agent", {
      data: {
        action: "stop",
      },
    });

    expect(stopResponse.ok()).toBeTruthy();
  });

  test("should verify questionnaire UI elements", async ({ page }) => {
    await page.goto("/call");

    // Wait for questionnaires to load
    await page.waitForSelector("select", { timeout: 10000 });
    await page.waitForLoadState("networkidle");

    // Check questionnaire dropdown
    const questionnaireSelect = page.locator("select");
    await expect(questionnaireSelect).toBeVisible();

    // Check questionnaire label
    await expect(page.locator("text=Interview Questionnaire")).toBeVisible();

    // Check that we have options
    const options = await questionnaireSelect.locator("option").all();
    expect(options.length).toBeGreaterThan(0);

    // Check that we can select different questionnaires
    await questionnaireSelect.selectOption({ index: 0 });
    await questionnaireSelect.selectOption({ index: 1 });
    await questionnaireSelect.selectOption({ index: 2 });

    // Verify the selection changes
    const selectedValue = await questionnaireSelect.inputValue();
    expect(selectedValue).toBeDefined();
  });
});
