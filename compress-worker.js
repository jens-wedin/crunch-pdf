import { PDFDocument } from 'pdf-lib';

self.onmessage = async (e) => {
    const { pages, stripMetadata, objectsPerTick } = e.data;

    try {
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

        for (let i = 0; i < pages.length; i++) {
            self.postMessage({ type: 'progress', data: `Embedding page ${i + 1} of ${pages.length}…` });
            const { jpegBytes, width, height } = pages[i];
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
