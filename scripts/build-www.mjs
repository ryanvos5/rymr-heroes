/* ============================================================
   build-www — verzamelt alle web-assets in www/ zodat Capacitor
   ze in de iOS-app-bundle kan stoppen. De web-deploy (GitHub
   Pages / Vercel) blijft gewoon vanuit de repo-root draaien.
   Draai:  npm run build   (of automatisch via  npm run sync)
   ============================================================ */
import { rmSync, mkdirSync, cpSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const out = path.join(root, 'www');

// alleen deze bestanden/mappen horen in de app-bundle
const include = ['index.html', 'css', 'js', 'vendor', 'icon.png', 'logo.png', 'menu-bg.svg'];

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

let copied = 0;
for (const item of include) {
  const src = path.join(root, item);
  if (!existsSync(src)) { console.warn('  overslaan (bestaat niet):', item); continue; }
  cpSync(src, path.join(out, item), { recursive: true });
  copied++;
  console.log('  +', item);
}
console.log(`www/ klaar — ${copied}/${include.length} items gekopieerd.`);
