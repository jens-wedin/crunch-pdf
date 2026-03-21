import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
pdfjsLib.GlobalWorkerOptions.workerSrc = '/crunch-pdf/pdf.worker.min.mjs';

// DOM Elements
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const removeBtn = document.getElementById('removeBtn');
const compressionSection = document.getElementById('compressionSection');
const compressBtn = document.getElementById('compressBtn');
const progressSection = document.getElementById('progressSection');
const progressText = document.getElementById('progressText');
const resultSection = document.getElementById('resultSection');
const originalSize = document.getElementById('originalSize');
const compressedSize = document.getElementById('compressedSize');
const savings = document.getElementById('savings');
const newFileBtn = document.getElementById('newFileBtn');

// State
let currentFile = null;
let currentFileBytes = null;

// Utility Functions
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function showElement(element) {
    element.style.display = '';
}

function hideElement(element) {
    element.style.display = 'none';
}

// Drag and Drop Handlers
dropZone.addEventListener('click', () => {
    fileInput.click();
});

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
});

// File Handling
async function handleFile(file) {
    // Validate PDF
    if (file.type !== 'application/pdf') {
        alert('Please upload a PDF file');
        return;
    }

    currentFile = file;

    // Read file as ArrayBuffer
    const reader = new FileReader();
    reader.onload = async (e) => {
        currentFileBytes = new Uint8Array(e.target.result);

        // Update UI
        fileName.textContent = file.name;
        fileSize.textContent = formatBytes(file.size);

        hideElement(dropZone);
        showElement(fileInfo);
        showElement(compressionSection);
    };

    reader.readAsArrayBuffer(file);
}

// Remove File
removeBtn.addEventListener('click', () => {
    resetApp();
});

// Compression
compressBtn.addEventListener('click', async () => {
    const compressionLevel = document.querySelector('input[name="compression"]:checked').value;

    // Hide compression section, show progress
    hideElement(compressionSection);
    showElement(progressSection);

    try {
        const compressedBytes = await compressPDF(currentFileBytes, compressionLevel);

        // Hide progress, show result
        hideElement(progressSection);

        // Update result stats
        const originalSizeBytes = currentFile.size;
        const compressedSizeBytes = compressedBytes.length;
        const savedBytes = originalSizeBytes - compressedSizeBytes;
        const savedPercentage = Math.round((savedBytes / originalSizeBytes) * 100);

        originalSize.textContent = formatBytes(originalSizeBytes);
        compressedSize.textContent = formatBytes(compressedSizeBytes);
        savings.textContent = `Saved ${formatBytes(savedBytes)} (${savedPercentage}%)`;

        showElement(resultSection);

        // Trigger download
        downloadPDF(compressedBytes, currentFile.name);

    } catch (error) {
        console.error('Compression error:', error);
        alert('An error occurred while compressing the PDF. Please try again.');
        hideElement(progressSection);
        showElement(compressionSection);
    }
});

// PDF Compression Logic
async function compressPDF(pdfBytes, level) {
    const settings = getCompressionSettings(level);

    if (settings.rasterize) {
        return compressPDFViaRasterize(pdfBytes, settings);
    }

    progressText.textContent = 'Loading PDF...';
    const pdfDoc = await PDFDocument.load(pdfBytes);

    progressText.textContent = 'Compressing PDF...';
    const compressedPdfDoc = await PDFDocument.create();
    const pageCount = pdfDoc.getPageCount();
    const copiedPages = await compressedPdfDoc.copyPages(pdfDoc, [...Array(pageCount).keys()]);
    copiedPages.forEach(page => compressedPdfDoc.addPage(page));

    if (settings.stripMetadata) {
        compressedPdfDoc.setTitle('');
        compressedPdfDoc.setAuthor('');
        compressedPdfDoc.setSubject('');
        compressedPdfDoc.setKeywords([]);
        compressedPdfDoc.setProducer('');
        compressedPdfDoc.setCreator('');
    }

    progressText.textContent = 'Finalizing...';
    return compressedPdfDoc.save({
        useObjectStreams: true,
        addDefaultPage: false,
        objectsPerTick: settings.objectsPerTick,
    });
}

/**
 * High compression: rasterize each page via pdf.js → canvas → JPEG (imageQuality),
 * then rebuild PDF with pdf-lib. Maximizes size reduction; text becomes raster.
 */
async function compressPDFViaRasterize(pdfBytes, settings) {
    const quality = Math.max(0.1, Math.min(1, settings.imageQuality / 100));
    const scale = 1;

    progressText.textContent = 'Loading PDF...';
    const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
    const pdf = await loadingTask.promise;
    const pageCount = pdf.numPages;

    const pages = [];
    for (let i = 1; i <= pageCount; i++) {
        progressText.textContent = `Rasterizing page ${i} of ${pageCount}…`;
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        const ctx = canvas.getContext('2d');
        await page.render({
            canvasContext: ctx,
            viewport,
            intent: 'print',
        }).promise;

        const jpegBytes = await new Promise((resolve, reject) => {
            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        reject(new Error('Failed to encode page as JPEG'));
                        return;
                    }
                    const r = new FileReader();
                    r.onload = () => resolve(new Uint8Array(r.result));
                    r.onerror = () => reject(r.error);
                    r.readAsArrayBuffer(blob);
                },
                'image/jpeg',
                quality
            );
        });
        pages.push({ jpegBytes, width: viewport.width, height: viewport.height });
    }

    progressText.textContent = 'Building PDF...';
    const doc = await PDFDocument.create();
    doc.setTitle('');
    doc.setAuthor('');
    doc.setSubject('');
    doc.setKeywords([]);
    doc.setProducer('');
    doc.setCreator('');

    for (const { jpegBytes, width, height } of pages) {
        const img = await doc.embedJpg(jpegBytes);
        const page = doc.addPage([width, height]);
        page.drawImage(img, { x: 0, y: 0, width, height });
    }

    progressText.textContent = 'Finalizing...';
    return doc.save({
        useObjectStreams: true,
        addDefaultPage: false,
        objectsPerTick: settings.objectsPerTick,
    });
}

/**
 * Compression settings per level.
 * Level 1-2: object streams (non-rasterizing, preserves selectable text).
 * Level 3-5: rasterize pages to JPEG via pdf.js, then rebuild with pdf-lib.
 */
function getCompressionSettings(level) {
    switch (level) {
        case 'level1':
            return { imageQuality: 90, objectsPerTick: 50, stripMetadata: false, rasterize: false };
        case 'level2':
            return { imageQuality: 80, objectsPerTick: 100, stripMetadata: true, rasterize: false };
        case 'level3':
            return { imageQuality: 70, objectsPerTick: 150, stripMetadata: true, rasterize: true };
        case 'level4':
            return { imageQuality: 50, objectsPerTick: 200, stripMetadata: true, rasterize: true };
        case 'level5':
            return { imageQuality: 30, objectsPerTick: 200, stripMetadata: true, rasterize: true };
        default:
            return { imageQuality: 90, objectsPerTick: 50, stripMetadata: false, rasterize: false };
    }
}

// Download PDF
function downloadPDF(pdfBytes, originalFileName) {
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    // Generate compressed filename
    const nameWithoutExt = originalFileName.replace('.pdf', '');
    a.download = `${nameWithoutExt}_compressed.pdf`;

    // Trigger download
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Clean up
    URL.revokeObjectURL(url);
}

// Reset App
newFileBtn.addEventListener('click', () => {
    resetApp();
});

function resetApp() {
    currentFile = null;
    currentFileBytes = null;
    fileInput.value = '';

    hideElement(fileInfo);
    hideElement(compressionSection);
    hideElement(progressSection);
    hideElement(resultSection);
    showElement(dropZone);

    // Reset compression level to level 1
    document.getElementById('level1').checked = true;
}
