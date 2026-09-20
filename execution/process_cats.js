const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function extractTransparentCats() {
  console.log('Extracting transparent cat avatars with high fidelity...');
  const userUploadedDir = 'C:/Users/divye/.gemini/antigravity-ide/brain/7bdf7eed-448b-417a-b737-3d962619cb58/.user_uploaded';
  const imgPath1 = path.join(userUploadedDir, 'media_1789911251097.png');
  const imgPath2 = path.join(userUploadedDir, 'media_1789911227653.png');

  const b64_1 = fs.readFileSync(imgPath1).toString('base64');
  const b64_2 = fs.readFileSync(imgPath2).toString('base64');

  const assetsDir = path.resolve(__dirname, '../public/assets');
  if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    const cats = await page.evaluate(async (data1, data2) => {
      function loadImage(src) {
        return new Promise((res, rej) => {
          const img = new Image();
          img.onload = () => res(img);
          img.onerror = rej;
          img.src = src;
        });
      }

      const img1 = await loadImage('data:image/png;base64,' + data1); // 576 x 1024
      const img2 = await loadImage('data:image/png;base64,' + data2); // 563 x 496

      function getCroppedTransparent(img, sx, sy, sw, sh, bgThreshold = 220) {
        const c = document.createElement('canvas');
        c.width = sw;
        c.height = sh;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

        const imgData = ctx.getImageData(0, 0, sw, sh);
        const d = imgData.data;

        // Flood fill from borders to remove background without affecting white eyes/teeth!
        const visited = new Uint8Array(sw * sh);
        const isBg = (x, y) => {
          const i = (y * sw + x) * 4;
          return d[i] > bgThreshold && d[i + 1] > bgThreshold && d[i + 2] > bgThreshold;
        };

        const queue = [];
        // Add all edge pixels to queue
        for (let x = 0; x < sw; x++) {
          if (isBg(x, 0)) { visited[x] = 1; queue.push(x, 0); }
          if (isBg(x, sh - 1)) { visited[(sh - 1) * sw + x] = 1; queue.push(x, sh - 1); }
        }
        for (let y = 0; y < sh; y++) {
          if (isBg(0, y)) { visited[y * sw] = 1; queue.push(0, y); }
          if (isBg(sw - 1, y)) { visited[y * sw + (sw - 1)] = 1; queue.push(sw - 1, y); }
        }

        // BFS flood fill
        let head = 0;
        while (head < queue.length) {
          const cx = queue[head++];
          const cy = queue[head++];

          const neighbors = [
            [cx - 1, cy], [cx + 1, cy], [cx, cy - 1], [cx, cy + 1]
          ];
          for (const [nx, ny] of neighbors) {
            if (nx >= 0 && nx < sw && ny >= 0 && ny < sh) {
              const idx = ny * sw + nx;
              if (!visited[idx] && isBg(nx, ny)) {
                visited[idx] = 1;
                queue.push(nx, ny);
              }
            }
          }
        }

        // Set flood-filled background pixels to transparent, preserving cat's white eyes, teeth, and white coffee cup!
        for (let y = 0; y < sh; y++) {
          for (let x = 0; x < sw; x++) {
            const idx = y * sw + x;
            const i = idx * 4;
            if (visited[idx]) {
              d[i + 3] = 0; // completely transparent background
            }
          }
        }

        ctx.putImageData(imgData, 0, 0);
        return c.toDataURL('image/png');
      }

      return {
        // img1: 576 x 1024
        // Cat typing on laptop with coffee
        cat_laptop: getCroppedTransparent(img1, 380, 580, 186, 166, 215),
        // Cat holding BOSS mug
        cat_boss: getCroppedTransparent(img1, 20, 605, 145, 175, 215),
        // Cat with camera
        cat_camera: getCroppedTransparent(img1, 185, 220, 195, 200, 215),
        // Cat in box
        cat_box: getCroppedTransparent(img1, 24, 430, 246, 160, 215),
        // Cat in UFO
        cat_ufo: getCroppedTransparent(img1, 180, 15, 190, 210, 215),

        // img2: 563 x 496 (blob cats)
        // Happy smiling blob cat
        cat_happy: getCroppedTransparent(img2, 190, 345, 168, 140, 210),
        // Screaming blob cat
        cat_screaming: getCroppedTransparent(img2, 355, 140, 160, 165, 210),
        // Waving blob cat
        cat_waving: getCroppedTransparent(img2, 35, 125, 185, 155, 210)
      };
    }, b64_1, b64_2);

    for (const [name, dataUrl] of Object.entries(cats)) {
      const b64 = dataUrl.split(',')[1];
      const filePath = path.join(assetsDir, `${name}.png`);
      fs.writeFileSync(filePath, Buffer.from(b64, 'base64'));
      console.log(`Saved transparent cat: ${name}.png (${fs.statSync(filePath).size} bytes)`);
    }

    console.log('🎉 Extracted all cats with clean transparent backgrounds!');
  } finally {
    await browser.close();
  }
}

extractTransparentCats().catch(console.error);
