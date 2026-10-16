import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// Clean, high-contrast vector SVG with 100% solid white background
const faviconSvg = `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2563eb"/>
      <stop offset="50%" stop-color="#7c3aed"/>
      <stop offset="100%" stop-color="#06b6d4"/>
    </linearGradient>
    <linearGradient id="purple-grad" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#7c3aed"/>
      <stop offset="60%" stop-color="#9333ea"/>
      <stop offset="100%" stop-color="#3b82f6"/>
    </linearGradient>
    <radialGradient id="core-glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.25"/>
      <stop offset="60%" stop-color="#60a5fa" stop-opacity="0.10"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="nucleus-grad" cx="40%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#60a5fa"/>
      <stop offset="50%" stop-color="#2563eb"/>
      <stop offset="100%" stop-color="#1e3a8a"/>
    </radialGradient>
    <linearGradient id="diamond-fill" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#eff6ff" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="#dbeafe" stop-opacity="0.75"/>
    </linearGradient>
  </defs>

  <!-- 100% Solid Pure White Background across entire canvas -->
  <rect width="100" height="100" fill="#ffffff"/>

  <!-- Soft Blue Ambient Aura -->
  <circle cx="50" cy="50" r="38" fill="url(#core-glow)"/>

  <!-- Orbital Track -->
  <circle cx="50" cy="50" r="41" stroke="url(#ring-grad)" stroke-width="2" stroke-dasharray="4 2 10 3 20 4" opacity="0.45"/>
  <circle cx="50" cy="9" r="2.8" fill="#2563eb"/>

  <!-- CRMos Primary Swirl Arcs -->
  <path d="M 45 22 C 28 24 16 38 16 52 C 16 67 28 80 46 80 C 58 80 68 73 73 63" stroke="url(#ring-grad)" stroke-width="6.5" stroke-linecap="round"/>
  <path d="M 55 78 C 72 76 84 62 84 48 C 84 33 72 20 54 20 C 42 20 32 27 27 37" stroke="url(#purple-grad)" stroke-width="5.5" stroke-linecap="round"/>

  <!-- Center Diamond & Pulsar Core -->
  <polygon points="50,34 66,50 50,66 34,50" fill="url(#diamond-fill)" stroke="#3b82f6" stroke-width="1.8"/>
  <circle cx="50" cy="50" r="7.5" fill="url(#nucleus-grad)"/>
  <circle cx="50" cy="50" r="3" fill="#ffffff"/>
</svg>
`;

async function buildFavicons() {
  const publicDir = path.resolve('public');
  const distDir = path.resolve('dist');

  console.log('Generating solid white-background favicons...');

  // 1. Save SVG
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), faviconSvg.trim());
  if (fs.existsSync(distDir)) {
    fs.writeFileSync(path.join(distDir, 'favicon.svg'), faviconSvg.trim());
  }

  const svgBuffer = Buffer.from(faviconSvg);

  // 2. Generate PNGs at multiple sizes
  const sizes = [
    { name: 'favicon-16.png', size: 16 },
    { name: 'favicon-32.png', size: 32 },
    { name: 'favicon-48.png', size: 48 },
    { name: 'favicon-64.png', size: 64 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'favicon-192.png', size: 192 },
    { name: 'favicon-512.png', size: 512 },
  ];

  const pngBuffers = {};

  for (const { name, size } of sizes) {
    const pngBuf = await sharp(svgBuffer)
      .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .flatten({ background: { r: 255, g: 255, b: 255 } })
      .png()
      .toBuffer();

    pngBuffers[size] = pngBuf;
    fs.writeFileSync(path.join(publicDir, name), pngBuf);
    if (fs.existsSync(distDir)) {
      fs.writeFileSync(path.join(distDir, name), pngBuf);
    }
    console.log(`✓ Wrote ${name} (${size}x${size})`);
  }

  // 3. Build multi-resolution ICO file (containing 16x16, 32x32, 48x48)
  const icoSizes = [16, 32, 48];
  const numImages = icoSizes.length;

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type 1 = icon
  header.writeUInt16LE(numImages, 4); // count

  const dirSize = 16 * numImages;
  let offset = 6 + dirSize;

  const dirBuffers = [];
  const imgBuffers = [];

  for (const size of icoSizes) {
    const imgBuf = pngBuffers[size];
    imgBuffers.push(imgBuf);

    const dir = Buffer.alloc(16);
    dir.writeUInt8(size, 0); // width (0 = 256)
    dir.writeUInt8(size, 1); // height
    dir.writeUInt8(0, 2); // color count
    dir.writeUInt8(0, 3); // reserved
    dir.writeUInt16LE(1, 4); // color planes
    dir.writeUInt16LE(32, 6); // bits per pixel
    dir.writeUInt32LE(imgBuf.length, 8); // size of image data
    dir.writeUInt32LE(offset, 12); // offset of image data

    dirBuffers.push(dir);
    offset += imgBuf.length;
  }

  const icoBuffer = Buffer.concat([header, ...dirBuffers, ...imgBuffers]);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);
  if (fs.existsSync(distDir)) {
    fs.writeFileSync(path.join(distDir, 'favicon.ico'), icoBuffer);
  }
  console.log('✓ Wrote multi-resolution favicon.ico (16, 32, 48px)');

  console.log('All white-background favicons generated successfully!');
}

buildFavicons().catch((err) => {
  console.error(err);
  process.exit(1);
});
