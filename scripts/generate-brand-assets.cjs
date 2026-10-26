const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const MASTER_SVG_PATH = path.join(
  __dirname,
  '..',
  'public',
  'favicon.svg'
);

// Fallback to brain master vector if available
const BRAIN_SVG_PATH =
  '/home/jsdrenthe/.gemini/antigravity/brain/9e45151b-879f-4a4c-9444-932a3fd440a1/scratch/logo-square.svg';

const sourceSvgPath = fs.existsSync(BRAIN_SVG_PATH) ? BRAIN_SVG_PATH : MASTER_SVG_PATH;

/**
 * Packs multiple PNG buffers into a valid Windows/Browser ICO file
 */
function createIcoFromPngs(pngBuffersWithSizes) {
  const count = pngBuffersWithSizes.length;
  const headerSize = 6;
  const directorySize = 16 * count;
  let currentOffset = headerSize + directorySize;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type 1 = icon
  header.writeUInt16LE(count, 4); // number of images

  const directories = [];
  const imageBuffers = [];

  for (const { width, height, buffer } of pngBuffersWithSizes) {
    const dir = Buffer.alloc(16);
    dir.writeUInt8(width >= 256 ? 0 : width, 0); // 0 means 256
    dir.writeUInt8(height >= 256 ? 0 : height, 1);
    dir.writeUInt8(0, 2); // color palette
    dir.writeUInt8(0, 3); // reserved
    dir.writeUInt16LE(1, 4); // color planes
    dir.writeUInt16LE(32, 6); // bpp
    dir.writeUInt32LE(buffer.length, 8); // size of image data
    dir.writeUInt32LE(currentOffset, 12); // offset

    directories.push(dir);
    imageBuffers.push(buffer);
    currentOffset += buffer.length;
  }

  return Buffer.concat([header, ...directories, ...imageBuffers]);
}

async function generateAllAssets() {
  console.log('🚀 LogoAnywhere: Brand Asset Generator gestart...');
  console.log('📂 Bron SVG:', sourceSvgPath);
  console.log('📁 Doelmap:', PUBLIC_DIR);

  const svgContent = fs.readFileSync(sourceSvgPath);

  // 1. Transparent Master Logo (1024x1024)
  console.log('Generating master transparent PNG...');
  const masterPngBuffer = await sharp(svgContent, { density: 300 })
    .resize(1024, 1024, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(PUBLIC_DIR, 'crmos-logo.png'), masterPngBuffer);
  console.log('  ✓ public/crmos-logo.png (1024x1024, transparant)');

  // 2. Favicon SVG
  // Modern, clean SVG favicon with dark/light mode compatibility
  const cleanFaviconSvg = `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3b82f6"/>
      <stop offset="45%" stop-color="#6366f1"/>
      <stop offset="75%" stop-color="#8b5cf6"/>
      <stop offset="100%" stop-color="#06b6d4"/>
    </linearGradient>
    <radialGradient id="core-glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="45%" stop-color="#60a5fa"/>
      <stop offset="80%" stop-color="#3b82f6"/>
      <stop offset="100%" stop-color="#1e3a8a"/>
    </radialGradient>
    <linearGradient id="arc-grad" x1="15%" y1="15%" x2="85%" y2="85%">
      <stop offset="0%" stop-color="#60a5fa"/>
      <stop offset="50%" stop-color="#a855f7"/>
      <stop offset="100%" stop-color="#ec4899"/>
    </linearGradient>
    <linearGradient id="chrome-grad" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#94a3b8" stop-opacity="0.25"/>
      <stop offset="50%" stop-color="#ffffff" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="#64748b" stop-opacity="0.3"/>
    </linearGradient>
  </defs>
  <circle cx="50" cy="50" r="43" fill="url(#core-glow)" opacity="0.35"/>
  <circle cx="50" cy="50" r="44" stroke="url(#ring-grad)" stroke-width="2.5" stroke-dasharray="4 2 12 3 24 4" opacity="0.85"/>
  <circle cx="50" cy="6" r="2.5" fill="#ffffff"/>
  <circle cx="50" cy="50" r="47" stroke="#ffffff" stroke-width="1" stroke-dasharray="2 18 1 24" stroke-opacity="0.2"/>
  <path d="M 45 22 C 28 24 16 38 16 52 C 16 67 28 80 46 80 C 58 80 68 73 73 63" stroke="url(#ring-grad)" stroke-width="6" stroke-linecap="round"/>
  <path d="M 55 78 C 72 76 84 62 84 48 C 84 33 72 20 54 20 C 42 20 32 27 27 37" stroke="url(#arc-grad)" stroke-width="5" stroke-linecap="round" stroke-dasharray="95 15"/>
  <polygon points="50,33 67,50 50,67 33,50" fill="#ffffff" fill-opacity="0.1" stroke="url(#chrome-grad)" stroke-width="1.5"/>
  <circle cx="50" cy="50" r="7.5" fill="url(#core-glow)"/>
  <circle cx="50" cy="50" r="3.2" fill="#ffffff"/>
</svg>`;
  fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.svg'), cleanFaviconSvg);
  console.log('  ✓ public/favicon.svg (vector, schaalbaar)');

  // 3. Classical Multi-Size Favicon (favicon.ico: 16x16, 32x32, 48x48)
  console.log('Generating favicon.ico...');
  const icoPng16 = await sharp(masterPngBuffer).resize(16, 16).png().toBuffer();
  const icoPng32 = await sharp(masterPngBuffer).resize(32, 32).png().toBuffer();
  const icoPng48 = await sharp(masterPngBuffer).resize(48, 48).png().toBuffer();
  const icoPng64 = await sharp(masterPngBuffer).resize(64, 64).png().toBuffer();

  fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon-16.png'), icoPng16);
  fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon-32.png'), icoPng32);
  fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon-48.png'), icoPng48);
  fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon-64.png'), icoPng64);

  const icoBuffer = createIcoFromPngs([
    { width: 16, height: 16, buffer: icoPng16 },
    { width: 32, height: 32, buffer: icoPng32 },
    { width: 48, height: 48, buffer: icoPng48 },
  ]);
  fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.ico'), icoBuffer);
  console.log('  ✓ public/favicon.ico (16, 32, 48 px multi-size ICO)');
  console.log('  ✓ public/favicon-16.png, favicon-32.png, favicon-48.png, favicon-64.png');

  // 4. Apple Touch Icon (180x180 - Apple OLED Midnight #09090b background, 140x140 logo inner)
  console.log('Generating apple-touch-icon.png...');
  const appleInner = await sharp(masterPngBuffer).resize(140, 140, { fit: 'contain' }).png().toBuffer();
  const appleCanvas = await sharp({
    create: {
      width: 180,
      height: 180,
      channels: 4,
      background: { r: 9, g: 9, b: 11, alpha: 1 }, // #09090b
    },
  })
    .composite([{ input: appleInner, top: 20, left: 20 }])
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(PUBLIC_DIR, 'apple-touch-icon.png'), appleCanvas);
  console.log('  ✓ public/apple-touch-icon.png (180x180, Apple OLED background)');

  // 5. Android Chrome / PWA Icons (192x192 & 512x512 with safe-zone margin)
  console.log('Generating Android/PWA icons...');
  for (const size of [192, 512]) {
    const innerSize = Math.round(size * 0.82);
    const offset = Math.round((size - innerSize) / 2);
    const pwaInner = await sharp(masterPngBuffer).resize(innerSize, innerSize, { fit: 'contain' }).png().toBuffer();
    const pwaCanvas = await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 9, g: 9, b: 11, alpha: 1 },
      },
    })
      .composite([{ input: pwaInner, top: offset, left: offset }])
      .png()
      .toBuffer();

    fs.writeFileSync(path.join(PUBLIC_DIR, `android-chrome-${size}x${size}.png`), pwaCanvas);
    fs.writeFileSync(path.join(PUBLIC_DIR, `favicon-${size}.png`), pwaCanvas);
    console.log(`  ✓ public/android-chrome-${size}x${size}.png & favicon-${size}.png`);
  }

  // 6. Social Avatar (1000x1000 - 20% safe zone margin for circular crops on X/Twitter, LinkedIn, Instagram)
  console.log('Generating social-avatar.png...');
  const avatarInner = await sharp(masterPngBuffer).resize(720, 720, { fit: 'contain' }).png().toBuffer();
  const avatarCanvas = await sharp({
    create: {
      width: 1000,
      height: 1000,
      channels: 4,
      background: { r: 9, g: 9, b: 11, alpha: 1 },
    },
  })
    .composite([{ input: avatarInner, top: 140, left: 140 }])
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(PUBLIC_DIR, 'social-avatar.png'), avatarCanvas);
  console.log('  ✓ public/social-avatar.png (1000x1000, 20% circular safe zone)');

  // 7. Open Graph Preview (1200x630 - Apple Cinematic Hero card)
  console.log('Generating og-image.png (1200x630)...');
  const ogSvg = `<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="og-bg" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#141419"/>
      <stop offset="100%" stop-color="#050507"/>
    </radialGradient>
    <radialGradient id="og-glow" cx="50%" cy="40%" r="45%">
      <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.3"/>
      <stop offset="50%" stop-color="#8b5cf6" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="text-grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#60a5fa"/>
      <stop offset="50%" stop-color="#a855f7"/>
      <stop offset="100%" stop-color="#38bdf8"/>
    </linearGradient>
  </defs>

  <!-- Canvas Background -->
  <rect width="1200" height="630" fill="url(#og-bg)"/>
  <rect width="1200" height="630" fill="url(#og-glow)"/>

  <!-- Top Apple-style Hairline -->
  <line x1="0" y1="1" x2="1200" y2="1" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>

  <!-- Center Logo Emblem will be composited here -->

  <!-- Brand Typography -->
  <text x="600" y="440" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif" font-size="56" font-weight="800" fill="#ffffff" letter-spacing="-0.03em">
    CRM<tspan fill="url(#text-grad)">os</tspan>
  </text>
  <text x="600" y="490" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif" font-size="20" font-weight="600" fill="#94a3b8" letter-spacing="0.25em">
    OPERATING SYSTEM FOR GROWTH
  </text>
  <text x="600" y="540" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif" font-size="16" font-weight="400" fill="#64748b">
    Field Sales &#8226; Contact Center &#8226; Recruitment ATS &#8226; Realtime Geodata
  </text>
</svg>`;

  const ogLogo = await sharp(masterPngBuffer).resize(240, 240, { fit: 'contain' }).png().toBuffer();
  const ogCanvas = await sharp(Buffer.from(ogSvg))
    .composite([{ input: ogLogo, top: 120, left: 480 }])
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(PUBLIC_DIR, 'og-image.png'), ogCanvas);
  console.log('  ✓ public/og-image.png (1200x630, Apple Cinematic card)');

  // 8. Square and Full JPEG exports
  console.log('Generating JPEG brand exports...');
  const squareJpg = await sharp(masterPngBuffer)
    .resize(1024, 1024)
    .flatten({ background: { r: 9, g: 9, b: 11 } })
    .jpeg({ quality: 95 })
    .toBuffer();
  fs.writeFileSync(path.join(PUBLIC_DIR, 'crmos-logo-square.jpg'), squareJpg);
  fs.writeFileSync(path.join(PUBLIC_DIR, 'crmos-logo.jpg'), squareJpg);

  // 9. Web App Manifests (`site.webmanifest` & `manifest.json`)
  console.log('Generating site.webmanifest & manifest.json...');
  const manifestData = {
    name: 'CRMos — Operating System for Growth',
    short_name: 'CRMos',
    description: 'Hybride CRM voor Field Sales, Contact Centers en Recruitment.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#09090b',
    theme_color: '#09090b',
    icons: [
      {
        src: '/favicon-16.png',
        sizes: '16x16',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/favicon-32.png',
        sizes: '32x32',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  };

  const manifestJson = JSON.stringify(manifestData, null, 2);
  fs.writeFileSync(path.join(PUBLIC_DIR, 'site.webmanifest'), manifestJson);
  fs.writeFileSync(path.join(PUBLIC_DIR, 'manifest.json'), manifestJson);
  console.log('  ✓ public/site.webmanifest & public/manifest.json');

  console.log('\n🎉 LogoAnywhere: Complete Digital Asset Pack succesvol gegenereerd!');
}

generateAllAssets().catch((err) => {
  console.error('❌ Fout bij het genereren van assets:', err);
  process.exit(1);
});
