/* Versie- en buildnummer ophogen in het Xcode-project.
 *
 *   node scripts/bump.mjs          -> buildnummer +1  (voor een nieuwe upload)
 *   node scripts/bump.mjs 1.1      -> versie op 1.1 én buildnummer +1
 *
 * Apple-regels: het BUILDNUMMER moet bij elke upload hoger zijn dan alles wat je
 * ooit uploadde. De VERSIE moet hoger zijn dan de versie die live staat, maar
 * alleen als je een nieuwe versie indient (bugfix-build voor dezelfde versie mag
 * hetzelfde versienummer houden).
 */
import { readFileSync, writeFileSync } from 'node:fs';

const PBX = 'ios/App/App.xcodeproj/project.pbxproj';
const version = process.argv[2] || null;

if (version && !/^\d+(\.\d+){1,2}$/.test(version)) {
  console.error(`Ongeldige versie: "${version}". Gebruik bv. 1.1 of 1.2.3`);
  process.exit(1);
}

let src = readFileSync(PBX, 'utf8');

const current = Number((src.match(/CURRENT_PROJECT_VERSION = (\d+);/) || [])[1]);
if (!Number.isFinite(current)) {
  console.error('Kon CURRENT_PROJECT_VERSION niet vinden in ' + PBX);
  process.exit(1);
}
const next = current + 1;
src = src.replace(/CURRENT_PROJECT_VERSION = \d+;/g, `CURRENT_PROJECT_VERSION = ${next};`);

const oldVersion = (src.match(/MARKETING_VERSION = ([\d.]+);/) || [])[1];
if (version) src = src.replace(/MARKETING_VERSION = [\d.]+;/g, `MARKETING_VERSION = ${version};`);

writeFileSync(PBX, src);

console.log(`  versie : ${oldVersion}${version && version !== oldVersion ? ' -> ' + version : ' (ongewijzigd)'}`);
console.log(`  build  : ${current} -> ${next}`);
console.log('\nNu in Xcode: ⌘Q, opnieuw openen, buildnummer controleren, dan Archive.');
