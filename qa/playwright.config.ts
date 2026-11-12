import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
    testDir: ".",
    testMatch: "*.spec.ts",
    fullyParallel: false,
    retries: 0,
    reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
    use: {
        baseURL: process.env.PAWPAL_BASE_URL || "http://127.0.0.1:5173",
        trace: "retain-on-failure",
        screenshot: "only-on-failure",
        video: "retain-on-failure"
    },
    projects: [
        { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
        { name: "tablet", use: { ...devices["iPad Mini"], viewport: { width: 768, height: 1024 }, isMobile: true, hasTouch: true } },
        { name: "phone", use: { ...devices["iPhone 13"], viewport: { width: 390, height: 844 } } }
    ],
    outputDir: "test-results"
});
