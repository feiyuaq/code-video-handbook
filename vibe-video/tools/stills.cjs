// 一次打包、多帧抽图。用法：
//   node tools/stills.cjs <CompId> <outDir> <frames 逗号分隔>
// 避免反复启动 CLI（Windows 上连续调用 remotion still 会卡在缓存清理/浏览器启动）。
const path = require('path');
const fs = require('fs');
const { bundle } = require('@remotion/bundler');
const { renderStill, selectComposition } = require('@remotion/renderer');

const [, , id, outDir, framesArg] = process.argv;
const frames = (framesArg || '').split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => !Number.isNaN(n));
const browserExecutable = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const root = path.resolve(__dirname, '..');

(async () => {
  fs.mkdirSync(path.join(root, outDir), { recursive: true });
  console.log('bundling...');
  const serveUrl = await bundle({
    entryPoint: path.join(root, 'src/index.ts'),
    publicDir: path.join(root, 'public'),
    onProgress: (p) => {
      if (p % 25 === 0) console.log(`  bundle ${p}%`);
    },
  });
  const composition = await selectComposition({ serveUrl, id, browserExecutable });
  console.log(`composition ${id} ${composition.durationInFrames}f`);
  for (const frame of frames) {
    const output = path.join(root, outDir, `f${frame}.png`);
    await renderStill({ composition, serveUrl, output, frame, browserExecutable, imageFormat: 'png' });
    console.log(`  ✓ ${output}`);
  }
  console.log('done');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
