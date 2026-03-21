import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { writeFileSync } from 'fs';

const doc = await PDFDocument.create();
const font = await doc.embedFont(StandardFonts.Helvetica);

for (let i = 0; i < 3; i++) {
    const page = doc.addPage([612, 792]);
    page.drawText(`Test page ${i + 1}`, {
        x: 50,
        y: 700,
        size: 24,
        font,
        color: rgb(0, 0, 0),
    });
    page.drawText('Lorem ipsum dolor sit amet, consectetur adipiscing elit.', {
        x: 50,
        y: 650,
        size: 12,
        font,
        color: rgb(0.3, 0.3, 0.3),
    });
}

doc.setTitle('Test PDF');
doc.setAuthor('Test Author');
doc.setSubject('Test Subject');

const bytes = await doc.save();
writeFileSync(new URL('./test.pdf', import.meta.url), bytes);
console.log(`Generated test.pdf (${bytes.length} bytes)`);
