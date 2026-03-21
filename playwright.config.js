import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './e2e',
    timeout: 60000,
    use: {
        baseURL: 'http://localhost:4173/crunch-pdf/',
        headless: true,
    },
    webServer: {
        command: 'npx vite preview --port 4173',
        port: 4173,
        reuseExistingServer: !process.env.CI,
    },
    projects: [
        { name: 'chromium', use: { browserName: 'chromium' } },
    ],
});
