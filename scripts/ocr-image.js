/**
 * OCR a single image using tesseract.js + Chinese language data
 * Usage: node scripts/ocr-image.js "data/job-requirements/屏幕截图 2026-05-26 140254.png"
 */
const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function ocr(imagePath) {
  const absPath = path.resolve(imagePath);
  if (!fs.existsSync(absPath)) {
    console.error('File not found:', absPath);
    process.exit(1);
  }

  const outPath = absPath.replace(/\.(png|jpg|jpeg|webp|bmp)$/i, '.txt');
  const tessdataDir = path.resolve(__dirname, '..', 'data', 'tessdata');

  console.log('Input:   ', absPath);
  console.log('Output:  ', outPath);
  console.log('Tessdata:', tessdataDir);
  console.log('');

  // Preprocess: grayscale + normalize contrast for better CJK OCR
  const preprocessed = await sharp(absPath)
    .grayscale()
    .normalize()
    .sharpen()
    .toBuffer();

  console.log('Preprocessing done, starting OCR...\n');

  const worker = await Tesseract.createWorker(['chi_sim'], 1, {
    langPath: tessdataDir,
  });

  const start = Date.now();
  const { data } = await worker.recognize(preprocessed);
  await worker.terminate();

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`OCR done in ${elapsed}s\n`);

  fs.writeFileSync(outPath, data.text, 'utf-8');
  console.log('Saved to:', outPath);
  console.log('');
  console.log('--- OCR Text Preview (first 20 lines) ---');
  const lines = data.text.split('\n').slice(0, 20);
  lines.forEach((l, i) => console.log(`${i + 1}\t${l}`));
}

const img = process.argv[2];
if (!img) {
  console.error('Usage: node scripts/ocr-image.js <image-path>');
  process.exit(1);
}
ocr(img).catch(e => { console.error(e); process.exit(1); });
