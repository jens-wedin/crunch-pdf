export function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Compression settings per level.
 * Level 1-2: object streams (non-rasterizing, preserves selectable text).
 * Level 3-5: rasterize pages to JPEG via pdf.js, then rebuild with pdf-lib.
 */
export function getCompressionSettings(level) {
    switch (level) {
        case 'level1':
            return { objectsPerTick: 50, stripMetadata: false, rasterize: false };
        case 'level2':
            return { objectsPerTick: 100, stripMetadata: true, rasterize: false };
        case 'level3':
            return { imageQuality: 85, scale: 1.0, objectsPerTick: 150, stripMetadata: true, rasterize: true };
        case 'level4':
            return { imageQuality: 70, scale: 1.0, objectsPerTick: 200, stripMetadata: true, rasterize: true };
        case 'level5':
            return { imageQuality: 50, scale: 0.75, objectsPerTick: 200, stripMetadata: true, rasterize: true };
        default:
            return { objectsPerTick: 50, stripMetadata: false, rasterize: false };
    }
}
