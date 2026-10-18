const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const SOURCE_IMAGE = 'C:/Users/Suvesh/.gemini/antigravity/brain/8f8b63e8-5ae9-412a-ab40-d08834086a41/.user_uploaded/media_1792349604189_f85aba0f.png';

async function generate() {
  console.log('Reading source image from:', SOURCE_IMAGE);
  const srcBuf = fs.readFileSync(SOURCE_IMAGE);
  const base64Src = `data:image/png;base64,${srcBuf.toString('base64')}`;

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  // Helper inside browser to generate canvas data URL
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <body>
        <img id="srcImg" src="${base64Src}" />
      </body>
    </html>
  `);

  await page.waitForSelector('#srcImg');

  const renderIcon = async (width, height, options = {}) => {
    return await page.evaluate(({ width, height, options }) => {
      const img = document.getElementById('srcImg');
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Background
      if (options.bg) {
        ctx.fillStyle = options.bg;
        if (options.circle) {
          ctx.beginPath();
          ctx.arc(width / 2, height / 2, width / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (options.rounded) {
          const r = width * 0.22;
          ctx.beginPath();
          ctx.moveTo(r, 0);
          ctx.lineTo(width - r, 0);
          ctx.quadraticCurveTo(width, 0, width, r);
          ctx.lineTo(width, height - r);
          ctx.quadraticCurveTo(width, height, width - r, height);
          ctx.lineTo(r, height);
          ctx.quadraticCurveTo(0, height, 0, height - r);
          ctx.lineTo(0, r);
          ctx.quadraticCurveTo(0, 0, r, 0);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.fillRect(0, 0, width, height);
        }
      }

      // Scaling and centering
      const paddingRatio = options.paddingRatio || (options.isAdaptiveForeground ? 0.66 : 0.9);
      const targetSize = Math.min(width, height) * paddingRatio;
      const scale = targetSize / Math.max(img.naturalWidth, img.naturalHeight);
      const drawW = img.naturalWidth * scale;
      const drawH = img.naturalHeight * scale;
      const dx = (width - drawW) / 2;
      const dy = (height - drawH) / 2;

      ctx.drawImage(img, dx, dy, drawW, drawH);

      return canvas.toDataURL(options.format || 'image/png');
    }, { width, height, options });
  };

  const saveFile = (dataUrl, targetPath) => {
    const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(targetPath, Buffer.from(base64Data, 'base64'));
    console.log(`Saved: ${targetPath}`);
  };

  console.log('\n--- Generating Web & Public Logos ---');
  // 1. Web assets
  saveFile(await renderIcon(128, 128, { paddingRatio: 0.95 }), path.resolve(__dirname, '../public/favicon.png'));
  saveFile(await renderIcon(128, 128, { paddingRatio: 0.95 }), path.resolve(__dirname, '../public/logo-mark.png'));
  saveFile(await renderIcon(512, 512, { paddingRatio: 0.92 }), path.resolve(__dirname, '../public/logo.png'));
  saveFile(await renderIcon(192, 192, { paddingRatio: 0.92 }), path.resolve(__dirname, '../public/icon-192.png'));
  saveFile(await renderIcon(512, 512, { paddingRatio: 0.92 }), path.resolve(__dirname, '../public/icon-512.png'));
  saveFile(await renderIcon(180, 180, { bg: '#0B1120', rounded: true, paddingRatio: 0.8 }), path.resolve(__dirname, '../public/apple-touch-icon.png'));
  saveFile(await renderIcon(512, 512, { bg: '#0B1120', format: 'image/jpeg', paddingRatio: 0.82 }), path.resolve(__dirname, '../public/logo.jpg'));

  // 2. SVG Favicon
  const favicon512Data = await renderIcon(512, 512, { paddingRatio: 0.92 });
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <image href="${favicon512Data}" width="512" height="512" />
</svg>`;
  fs.writeFileSync(path.resolve(__dirname, '../public/favicon.svg'), svgContent);
  console.log('Saved: public/favicon.svg');

  // 3. Multi-resolution Favicon.ico
  console.log('\n--- Generating Windows Favicon.ico ---');
  const icoSizes = [16, 32, 48, 64, 128, 256];
  const pngBuffers = [];
  for (const s of icoSizes) {
    const dUrl = await renderIcon(s, s, { paddingRatio: 0.95 });
    pngBuffers.push({
      size: s,
      buf: Buffer.from(dUrl.replace(/^data:image\/\w+;base64,/, ''), 'base64')
    });
  }

  // Build standard ICO format with embedded PNGs
  const numImages = pngBuffers.length;
  const headerSize = 6 + (16 * numImages);
  let curOffset = headerSize;
  const headerBuf = Buffer.alloc(headerSize);

  // ICONDIR header
  headerBuf.writeUInt16LE(0, 0); // reserved
  headerBuf.writeUInt16LE(1, 2); // type 1 = icon
  headerBuf.writeUInt16LE(numImages, 4); // count

  for (let i = 0; i < numImages; i++) {
    const { size, buf } = pngBuffers[i];
    const entryOffset = 6 + (i * 16);
    headerBuf.writeUInt8(size === 256 ? 0 : size, entryOffset + 0); // width
    headerBuf.writeUInt8(size === 256 ? 0 : size, entryOffset + 1); // height
    headerBuf.writeUInt8(0, entryOffset + 2); // color count
    headerBuf.writeUInt8(0, entryOffset + 3); // reserved
    headerBuf.writeUInt16LE(1, entryOffset + 4); // planes
    headerBuf.writeUInt16LE(32, entryOffset + 6); // bpp
    headerBuf.writeUInt32LE(buf.length, entryOffset + 8); // size
    headerBuf.writeUInt32LE(curOffset, entryOffset + 12); // offset
    curOffset += buf.length;
  }

  const icoBuf = Buffer.concat([headerBuf, ...pngBuffers.map(p => p.buf)]);
  fs.writeFileSync(path.resolve(__dirname, '../public/favicon.ico'), icoBuf);
  console.log('Saved: public/favicon.ico');

  // 4. Android Adaptive Foreground & Legacy Icons
  console.log('\n--- Generating Android App Icons ---');
  const androidResDir = path.resolve(__dirname, '../android/app/src/main/res');

  // Adaptive foregrounds (108dp grid, 72dp safe zone = 66% ratio)
  const foregrounds = [
    { dir: 'drawable', size: 432 },
    { dir: 'mipmap-mdpi', size: 108 },
    { dir: 'mipmap-hdpi', size: 162 },
    { dir: 'mipmap-xhdpi', size: 216 },
    { dir: 'mipmap-xxhdpi', size: 324 },
    { dir: 'mipmap-xxxhdpi', size: 432 }
  ];

  for (const f of foregrounds) {
    const dUrl = await renderIcon(f.size, f.size, { isAdaptiveForeground: true, paddingRatio: 0.68 });
    saveFile(dUrl, path.join(androidResDir, f.dir, 'ic_launcher_foreground.png'));
  }

  // Legacy square & round icons (with #0B1120 background)
  const legacyIcons = [
    { dir: 'mipmap-mdpi', size: 48 },
    { dir: 'mipmap-hdpi', size: 72 },
    { dir: 'mipmap-xhdpi', size: 96 },
    { dir: 'mipmap-xxhdpi', size: 144 },
    { dir: 'mipmap-xxxhdpi', size: 192 }
  ];

  for (const l of legacyIcons) {
    // Square / rounded square
    const sqUrl = await renderIcon(l.size, l.size, { bg: '#0B1120', rounded: true, paddingRatio: 0.78 });
    saveFile(sqUrl, path.join(androidResDir, l.dir, 'ic_launcher.png'));

    // Circle
    const rndUrl = await renderIcon(l.size, l.size, { bg: '#0B1120', circle: true, paddingRatio: 0.78 });
    saveFile(rndUrl, path.join(androidResDir, l.dir, 'ic_launcher_round.png'));
  }

  await browser.close();
  console.log('\n✅ All website and Android APK icons generated successfully!');
}

generate().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
