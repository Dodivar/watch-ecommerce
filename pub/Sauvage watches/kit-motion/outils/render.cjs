#!/usr/bin/env node
/*
 * Exporte une composition du kit motion en MP4 (H.264, 30 i/s, sans son) ou en images fixes.
 *
 *   node outils/render.cjs <composition> <story|post> video  <sortie.mp4>
 *   node outils/render.cjs <composition> <story|post> stills <préfixe> <t1> <t2> …
 *
 * <composition> : dossier contenant index.html (ex. compositions/coup-de-foudre) ou chemin d'un .html.
 * Prérequis : ffmpeg dans le PATH, Playwright + Chromium (`npx playwright install chromium` en local).
 * L'export est image par image (render(t) puis capture) : il ne dépend pas de la vitesse de la machine.
 */
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('@playwright/test')); }

const FPS = 30;

(async () => {
  const [, , target, format = 'story', mode = 'video', out, ...times] = process.argv;
  if (!target || !out || !['story', 'post'].includes(format) || !['video', 'stills'].includes(mode)) {
    console.error('Usage : node outils/render.cjs <composition> <story|post> <video|stills> <sortie> [t…]');
    process.exit(1);
  }
  const html = fs.statSync(target).isDirectory() ? path.join(target, 'index.html') : target;
  const W = 1080, H = format === 'post' ? 1350 : 1920;

  // Chromium de Playwright ; à défaut (version du dépôt sans navigateur téléchargé), un Chrome
  // désigné par CHROMIUM_PATH ou celui préinstallé des sessions Claude Code dans le cloud.
  let browser;
  try {
    browser = await chromium.launch();
  } catch (e) {
    const exe = [process.env.CHROMIUM_PATH, '/opt/pw-browsers/chromium'].find(p => p && fs.existsSync(p));
    if (!exe) throw new Error('Chromium introuvable : lancer `npx playwright install chromium` ou définir CHROMIUM_PATH.\n' + e.message);
    browser = await chromium.launch({ executablePath: exe, args: ['--headless', '--no-sandbox'] });
  }
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  page.on('pageerror', e => { console.error('Erreur dans la composition :', e.message); process.exitCode = 1; });
  await page.goto('file://' + path.resolve(html) + `?render&format=${format}`);
  await page.evaluate(() => globalThis.ready);

  if (mode === 'stills') {
    for (const t of times) {
      await page.evaluate(t => globalThis.render(t), +t);
      const file = `${out}_${format}_${t}.png`;
      await page.screenshot({ path: file });
      console.log(file);
    }
  } else {
    const duration = await page.evaluate(() => globalThis.DURATION);
    const n = Math.round(duration * FPS);
    const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-profile:v', 'high',
      '-movflags', '+faststart', out], { stdio: ['pipe', 'ignore', 'inherit'] });
    for (let i = 0; i < n; i++) {
      await page.evaluate(t => globalThis.render(t), i / FPS);
      const buf = await page.screenshot({ type: 'png' });
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if (i % FPS === 0) process.stdout.write(`\r${format} ${Math.round((i / n) * 100)} %`);
    }
    ff.stdin.end();
    await new Promise(r => ff.on('close', r));
    console.log(`\r${format} 100 % → ${out}`);
  }
  await browser.close();
})();
