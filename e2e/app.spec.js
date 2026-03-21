import { test, expect } from '@playwright/test';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const testPdfPath = join(__dirname, 'test.pdf');

test.describe('Crunch PDF', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('shows drop zone on load', async ({ page }) => {
        await expect(page.locator('#dropZone')).toBeVisible();
        await expect(page.locator('#compressionSection')).toBeHidden();
        await expect(page.locator('#resultSection')).toBeHidden();
    });

    test('shows all five compression levels', async ({ page }) => {
        await expect(page.locator('#level1')).toBeAttached();
        await expect(page.locator('#level2')).toBeAttached();
        await expect(page.locator('#level3')).toBeAttached();
        await expect(page.locator('#level4')).toBeAttached();
        await expect(page.locator('#level5')).toBeAttached();
    });

    test('uploads a PDF and shows file info', async ({ page }) => {
        const fileInput = page.locator('#fileInput');
        await fileInput.setInputFiles(testPdfPath);

        await expect(page.locator('#fileName')).toHaveText('test.pdf');
        await expect(page.locator('#fileSize')).not.toBeEmpty();
        await expect(page.locator('#dropZone')).toBeHidden();
        await expect(page.locator('#compressionSection')).toBeVisible();
    });

    test('rejects non-PDF files', async ({ page }) => {
        page.on('dialog', async (dialog) => {
            expect(dialog.message()).toContain('PDF');
            await dialog.accept();
        });

        const fileInput = page.locator('#fileInput');
        // Create a fake text file
        await fileInput.setInputFiles({
            name: 'test.txt',
            mimeType: 'text/plain',
            buffer: Buffer.from('not a pdf'),
        });

        // Drop zone should still be visible (file was rejected)
        await expect(page.locator('#dropZone')).toBeVisible();
    });

    test('removes file and resets to initial state', async ({ page }) => {
        const fileInput = page.locator('#fileInput');
        await fileInput.setInputFiles(testPdfPath);
        await expect(page.locator('#fileInfo')).toBeVisible();

        await page.locator('#removeBtn').click();
        await expect(page.locator('#dropZone')).toBeVisible();
        await expect(page.locator('#fileInfo')).toBeHidden();
        await expect(page.locator('#compressionSection')).toBeHidden();
    });

    test('level1 is selected by default', async ({ page }) => {
        const fileInput = page.locator('#fileInput');
        await fileInput.setInputFiles(testPdfPath);

        await expect(page.locator('#level1')).toBeChecked();
    });

    test('can select different compression levels', async ({ page }) => {
        const fileInput = page.locator('#fileInput');
        await fileInput.setInputFiles(testPdfPath);

        await page.locator('label[for="level3"]').click();
        await expect(page.locator('#level3')).toBeChecked();
        await expect(page.locator('#level1')).not.toBeChecked();
    });

    test('compresses a PDF with level 1 and shows results', async ({ page }) => {
        const fileInput = page.locator('#fileInput');
        await fileInput.setInputFiles(testPdfPath);

        // Start compression
        const downloadPromise = page.waitForEvent('download');
        await page.locator('#compressBtn').click();

        // Wait for result
        await expect(page.locator('#resultSection')).toBeVisible({ timeout: 30000 });
        await expect(page.locator('#originalSize')).not.toBeEmpty();
        await expect(page.locator('#compressedSize')).not.toBeEmpty();

        // Verify download triggered
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toBe('test_compressed.pdf');
    });

    test('compresses a PDF with level 2 (strip metadata)', async ({ page }) => {
        const fileInput = page.locator('#fileInput');
        await fileInput.setInputFiles(testPdfPath);

        await page.locator('label[for="level2"]').click();

        const downloadPromise = page.waitForEvent('download');
        await page.locator('#compressBtn').click();

        await expect(page.locator('#resultSection')).toBeVisible({ timeout: 30000 });

        const download = await downloadPromise;
        expect(download.suggestedFilename()).toBe('test_compressed.pdf');
    });

    test('compresses a PDF with level 3 (rasterize)', async ({ page }) => {
        const fileInput = page.locator('#fileInput');
        await fileInput.setInputFiles(testPdfPath);

        await page.locator('label[for="level3"]').click();

        const downloadPromise = page.waitForEvent('download');
        await page.locator('#compressBtn').click();

        // Rasterization takes longer
        await expect(page.locator('#resultSection')).toBeVisible({ timeout: 60000 });

        const download = await downloadPromise;
        expect(download.suggestedFilename()).toBe('test_compressed.pdf');
    });

    test('can compress another file after completion', async ({ page }) => {
        const fileInput = page.locator('#fileInput');
        await fileInput.setInputFiles(testPdfPath);

        const downloadPromise = page.waitForEvent('download');
        await page.locator('#compressBtn').click();
        await expect(page.locator('#resultSection')).toBeVisible({ timeout: 30000 });
        await downloadPromise;

        // Click "Compress Another File"
        await page.locator('#newFileBtn').click();
        await expect(page.locator('#dropZone')).toBeVisible();
        await expect(page.locator('#resultSection')).toBeHidden();
        await expect(page.locator('#level1')).toBeChecked();
    });
});
