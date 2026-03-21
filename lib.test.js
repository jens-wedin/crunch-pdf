import { describe, it, expect } from 'vitest';
import { formatBytes, getCompressionSettings } from './lib.js';

describe('formatBytes', () => {
    it('returns "0 Bytes" for 0', () => {
        expect(formatBytes(0)).toBe('0 Bytes');
    });

    it('formats bytes', () => {
        expect(formatBytes(500)).toBe('500 Bytes');
    });

    it('formats kilobytes', () => {
        expect(formatBytes(1024)).toBe('1 KB');
        expect(formatBytes(1536)).toBe('1.5 KB');
    });

    it('formats megabytes', () => {
        expect(formatBytes(1048576)).toBe('1 MB');
        expect(formatBytes(2621440)).toBe('2.5 MB');
    });

    it('formats gigabytes', () => {
        expect(formatBytes(1073741824)).toBe('1 GB');
    });
});

describe('getCompressionSettings', () => {
    it('returns non-rasterize settings for level1', () => {
        const s = getCompressionSettings('level1');
        expect(s.rasterize).toBe(false);
        expect(s.stripMetadata).toBe(false);
        expect(s.objectsPerTick).toBe(50);
        expect(s).not.toHaveProperty('imageQuality');
    });

    it('returns non-rasterize settings with metadata stripping for level2', () => {
        const s = getCompressionSettings('level2');
        expect(s.rasterize).toBe(false);
        expect(s.stripMetadata).toBe(true);
        expect(s.objectsPerTick).toBe(100);
        expect(s).not.toHaveProperty('imageQuality');
    });

    it('returns rasterize settings for level3', () => {
        const s = getCompressionSettings('level3');
        expect(s.rasterize).toBe(true);
        expect(s.stripMetadata).toBe(true);
        expect(s.imageQuality).toBe(70);
        expect(s.scale).toBe(1.0);
    });

    it('returns rasterize settings with DPI downscaling for level4', () => {
        const s = getCompressionSettings('level4');
        expect(s.rasterize).toBe(true);
        expect(s.imageQuality).toBe(50);
        expect(s.scale).toBe(0.75);
    });

    it('returns maximum compression settings for level5', () => {
        const s = getCompressionSettings('level5');
        expect(s.rasterize).toBe(true);
        expect(s.imageQuality).toBe(30);
        expect(s.scale).toBe(0.5);
    });

    it('returns level1 defaults for unknown levels', () => {
        const s = getCompressionSettings('unknown');
        expect(s.rasterize).toBe(false);
        expect(s.stripMetadata).toBe(false);
        expect(s.objectsPerTick).toBe(50);
    });

    it('has increasing objectsPerTick across levels', () => {
        const ticks = ['level1', 'level2', 'level3', 'level4', 'level5']
            .map(l => getCompressionSettings(l).objectsPerTick);
        for (let i = 1; i < ticks.length; i++) {
            expect(ticks[i]).toBeGreaterThanOrEqual(ticks[i - 1]);
        }
    });

    it('has decreasing imageQuality across rasterize levels', () => {
        const qualities = ['level3', 'level4', 'level5']
            .map(l => getCompressionSettings(l).imageQuality);
        for (let i = 1; i < qualities.length; i++) {
            expect(qualities[i]).toBeLessThan(qualities[i - 1]);
        }
    });

    it('has decreasing scale across rasterize levels', () => {
        const scales = ['level3', 'level4', 'level5']
            .map(l => getCompressionSettings(l).scale);
        for (let i = 1; i < scales.length; i++) {
            expect(scales[i]).toBeLessThan(scales[i - 1]);
        }
    });
});
