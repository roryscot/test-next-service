import { test, expect } from "@playwright/test";

test.describe("Interview Next Service", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto("http://localhost:3000");
  });

  test("should load the homepage", async ({ page }) => {
    await expect(page).toHaveTitle(/Interview/);
  });

  test("should navigate to questionnaire prompt builder", async ({ page }) => {
    await page.goto("http://localhost:3000/questionnaire-prompt-builder");

    // Check if the page loads correctly
    await expect(page.locator('h1, [data-testid="title"]')).toContainText(
      /Questionnaire|Prompt|Builder/
    );

    // Check if textarea is present
    await expect(page.locator("textarea")).toBeVisible();

    // Check if save button is present
    await expect(page.locator('button:has-text("Save")')).toBeVisible();
  });

  test("should save and load prompt", async ({ page }) => {
    await page.goto("http://localhost:3000/questionnaire-prompt-builder");

    const testPrompt = "Test interview prompt for Playwright testing";

    // Clear and fill the textarea
    await page.locator("textarea").fill(testPrompt);

    // Click save button
    await page.locator('button:has-text("Save")').click();

    // Wait for success toast or confirmation
    await expect(page.locator('[data-testid="toast"], .toast')).toBeVisible();

    // Reload page to verify persistence
    await page.reload();

    // Check if the prompt was saved
    await expect(page.locator("textarea")).toHaveValue(testPrompt);
  });

  test("should navigate to call page", async ({ page }) => {
    await page.goto("http://localhost:3000/call");

    // Check if the page loads correctly
    await expect(page.locator('h1, [data-testid="title"]')).toContainText(
      /Call|Interview/
    );

    // Check if room name input is present
    await expect(
      page.locator('input[placeholder*="room"], input[placeholder*="Room"]')
    ).toBeVisible();

    // Check if connect button is present
    await expect(page.locator('button:has-text("Connect")')).toBeVisible();
  });

  test("should show connection status on call page", async ({ page }) => {
    await page.goto("http://localhost:3000/call");

    // Check if connection status is displayed
    await expect(page.locator("text=Connection Status")).toBeVisible();

    // Check if status shows disconnected initially
    await expect(page.locator("text=disconnected")).toBeVisible();
  });
});
