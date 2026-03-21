import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = '/crunch-pdf/pdf.worker.min.mjs';

self.onmessage = async (e) => {
    const { pdfBytes, imageQuality, scale, stripMetadata, objectsPerTick } = e.data;

    try {
        const quality = Math.max(0.1, Math.min(1, imageQuality / 100));

        self.postMessage({ type: 'progress', data: 'Loading PDF...' });
        const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
        const pdf = await loadingTask.promise;
        const pageCount = pdf.numPages;

        const pages = [];
        for (let i = 1; i <= pageCount; i++) {
            self.postMessage({ type: 'progress', data: `Rasterizing page ${i} of ${pageCount}…` });
            const page = await pdf.getPage(i);

            // Use original viewport for PDF page dimensions, scaled viewport for rendering
            const originalViewport = page.getViewport({ scale: 1 });
            const renderViewport = page.getViewport({ scale });

            const canvas = new OffscreenCanvas(
                Math.floor(renderViewport.width),
                Math.floor(renderViewport.height)
            );
            const ctx = canvas.getContext('2d');
            await page.render({
                canvasContext: ctx,
                viewport: renderViewport,
                intent: 'print',
            }).promise;

            const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality });
            const jpegBytes = new Uint8Array(await blob.arrayBuffer());

            // Free canvas memory
            canvas.width = 0;
            canvas.height = 0;

            pages.push({
                jpegBytes,
                width: originalViewport.width,
                height: originalViewport.height,
            });
        }

        self.postMessage({ type: 'progress', data: 'Building PDF...' });
        const doc = await PDFDocument.create();
        if (stripMetadata) {
            doc.setTitle('');
            doc.setAuthor('');
            doc.setSubject('');
            doc.setKeywords([]);
            doc.setProducer('');
            doc.setCreator('');
        }

        for (const { jpegBytes, width, height } of pages) {
            const img = await doc.embedJpg(jpegBytes);
            const page = doc.addPage([width, height]);
            page.drawImage(img, { x: 0, y: 0, width, height });
        }

        self.postMessage({ type: 'progress', data: 'Finalizing...' });
        const compressedBytes = await doc.save({
            useObjectStreams: true,
            addDefaultPage: false,
            objectsPerTick,
        });

        self.postMessage({ type: 'done', data: compressedBytes.buffer }, [compressedBytes.buffer]);
    } catch (err) {
        self.postMessage({ type: 'error', data: err.message });
    }
};
