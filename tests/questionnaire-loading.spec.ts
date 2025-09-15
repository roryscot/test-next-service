import { test, expect } from "@playwright/test";

test.describe("Questionnaire Loading Test", () => {
  test("should load questionnaires on call page", async ({ page }) => {
    // Navigate to call page
    await page.goto("/call");

    // Wait for the page to load
    await page.waitForLoadState("networkidle");

    // Wait for questionnaires to load
    await page.waitForSelector("select", { timeout: 10000 });

    // Check that questionnaires are loaded
    const questionnaireSelect = page.locator("select");
    await expect(questionnaireSelect).toBeVisible();

    // Get all options
    const options = await questionnaireSelect.locator("option").all();
    console.log(`Found ${options.length} questionnaire options`);

    // Should have at least one questionnaire
    expect(options.length).toBeGreaterThan(0);

    // Check that we have the Strella interview questionnaire
    const optionTexts = await Promise.all(
      options.map(option => option.textContent())
    );
    console.log("Questionnaire options:", optionTexts);

    expect(optionTexts).toContain("Strella Interview Process");
  });
});
