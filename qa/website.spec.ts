import { test, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

const username = process.env.PAWPAL_QA_USERNAME;
const password = process.env.PAWPAL_QA_PASSWORD;
const stateChangingButton = /buy|purchase|claim|send|submit|feed|bathe|cuddle|sleep|wake|play|plant|water|harvest|gift|unfriend|remove|delete|reset|adjust|unlock|equip|publish|archive|accept|reject|confirm|log out|create account|save|cook|try to discover|invite|challenge|battle|request|message|pawmail/i;

async function inventoryVisibleButtons(page: import("@playwright/test").Page, section: string) {
    const buttons = await page.locator("button").evaluateAll(elements => elements.flatMap(element => {
        const button = element as HTMLButtonElement;
        const style = getComputedStyle(button);
        const rect = button.getBoundingClientRect();
        if (!rect.width || !rect.height || style.display === "none" || style.visibility === "hidden") return [];
        const imageAlt = Array.from(button.querySelectorAll("img[alt]"))
            .map(image => image.getAttribute("alt"))
            .filter(Boolean)
            .join(" ");
        return [{
            label: (button.getAttribute("aria-label") || button.getAttribute("title") || button.innerText || imageAlt || "")
                .trim()
                .replace(/\s+/g, " "),
            disabled: button.disabled
        }];
    }));
    return buttons.map(details => ({
        section,
        label: details.label,
        disabled: details.disabled,
        classification: stateChangingButton.test(details.label) ? "review-before-clicking" : "non-destructive-or-unknown",
        clicked: false as const
    }));
}

async function expectNoPageScroll(page: import("@playwright/test").Page) {
    const dimensions = await page.evaluate(() => ({
        documentHeight: document.documentElement.scrollHeight,
        viewportHeight: document.documentElement.clientHeight,
        bodyHeight: document.body.scrollHeight,
        viewportWidth: document.documentElement.clientWidth,
        pageWidth: document.documentElement.scrollWidth
    }));
    expect(dimensions.documentHeight, JSON.stringify(dimensions)).toBeLessThanOrEqual(dimensions.viewportHeight + 2);
    expect(dimensions.pageWidth, JSON.stringify(dimensions)).toBeLessThanOrEqual(dimensions.viewportWidth + 2);
}

test("welcome, signup, and login fit the screen and policy modals open", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /little world to call your own/i })).toBeVisible();
    await expect(page.getByRole("button", { name: "Privacy Policy" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Terms of Service" })).toBeVisible();
    await expectNoPageScroll(page);
    await page.getByRole("button", { name: "Privacy Policy" }).click();
    await expect(page.getByRole("dialog", { name: "Privacy Policy" })).toBeVisible();
    await page.getByRole("button", { name: /Read Terms of Service/ }).click();
    await expect(page.getByRole("dialog", { name: "Terms of Service" })).toBeVisible();
    await page.getByRole("button", { name: "Close policy" }).click();

    for (const size of [{ width: 1440, height: 900 }, { width: 768, height: 1024 }, { width: 390, height: 844 }]) {
        await page.setViewportSize(size);
        await expectNoPageScroll(page);
        await page.locator(".paw-welcome-header").getByRole("button", { name: "Create account" }).click();
        await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
        await expect(page.getByPlaceholder("Username")).toBeVisible();
        const signupCard = await page.locator(".auth-card").boundingBox();
        await expectNoPageScroll(page);
        await page.waitForTimeout(450);
        await page.getByRole("button", { name: "Already registered? Log in" }).click();
        await expect(page.getByRole("heading", { name: "Welcome back!" })).toBeVisible();
        const loginCard = await page.locator(".auth-card").boundingBox();
        expect(loginCard?.width).toBeCloseTo(signupCard?.width ?? 0, 0);
        expect(loginCard?.height).toBeCloseTo(signupCard?.height ?? 0, 0);
        await expectNoPageScroll(page);
        await page.goto("/");
    }
});

test("signed-in navigation and Settings policies work with a supplied test account", async ({ page }) => {
    test.skip(!username || !password, "Set PAWPAL_QA_USERNAME and PAWPAL_QA_PASSWORD to enable the signed-in browser check.");
    const pageErrors: string[] = [];
    const buttonInventory = [] as Awaited<ReturnType<typeof inventoryVisibleButtons>>;
    page.on("pageerror", error => pageErrors.push(error.message));
    await page.goto("/");
    await page.locator(".paw-welcome-header").getByRole("button", { name: "Log in" }).click();
    const fields = page.locator(".auth-card input");
    await fields.nth(0).fill(username!);
    await fields.nth(1).fill(password!);
    await page.getByRole("button", { name: "Log in", exact: true }).click();
    await expect(page.getByRole("button", { name: "Open Settings" })).toBeVisible({ timeout: 30000 });
    buttonInventory.push(...await inventoryVisibleButtons(page, "Room"));

    const sectionLabels = ["Room", "Friends", "Market", "Wardrobe", "Mini-games", "Multiplayer", "Lucky Garden", "Kitchen", "Missions"];
    for (const [sectionIndex, label] of sectionLabels.entries()) {
        const navigationToggle = page.getByRole("button", { name: "Toggle navigation" });
        const section = page.locator(".sidebar nav button").nth(sectionIndex);
        if (!(await section.isVisible()) && await navigationToggle.isVisible()) {
            await navigationToggle.click();
        }
        await expect(section).toBeVisible();
        await expect(section).toHaveAttribute("aria-label", new RegExp(`^${label}(?:$|,)`));
        await section.click();
        await expect(section).toHaveClass(/active/);
        await expect(page.locator(".layout")).toBeVisible();
        await page.locator(".paw-panel-loading").waitFor({ state: "hidden", timeout: 15000 }).catch(() => {});
        const visibleButtons = await inventoryVisibleButtons(page, label);
        buttonInventory.push(...visibleButtons);
        for (const button of visibleButtons) {
            expect(button.label, `Unlabeled visible button in ${label}`).not.toBe("");
        }
    }

    await page.getByRole("button", { name: "Open Settings" }).click();
    await expect(page.getByRole("dialog", { name: "Settings" })).toBeVisible();
    await page.getByRole("button", { name: "Terms of Service" }).click();
    await expect(page.getByRole("dialog", { name: /Terms of Service/ })).toBeVisible();
    await page.getByRole("button", { name: /Read Privacy Policy/ }).click();
    await expect(page.getByRole("dialog", { name: /Privacy Policy/ })).toBeVisible();
    await page.getByRole("button", { name: "Close policy" }).click();
    buttonInventory.push(...await inventoryVisibleButtons(page, "Settings"));
    for (const button of buttonInventory) {
        expect(button.label, `Unlabeled visible button in ${button.section}`).not.toBe("");
    }
    await mkdir("test-results", { recursive: true });
    await writeFile(`test-results/button-inventory-${test.info().project.name}.json`, JSON.stringify({
        generatedAt: new Date().toISOString(),
        baseURL: process.env.PAWPAL_BASE_URL || "http://127.0.0.1:5173",
        note: "Visible controls are inventoried. State-changing controls are flagged for review and are not clicked.",
        buttons: buttonInventory
    }, null, 2));
    expect(pageErrors, "browser runtime errors during signed-in navigation").toEqual([]);
});
