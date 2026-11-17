/**
 * Guards the public bundle boundary.
 *
 * Every anonymous visitor downloads the entry chunk, so the signed-in instructor and
 * learner app must stay in the lazily imported `LearnerAccess` chunk. This check fails
 * when signed-in UI or signed-in Firestore paths appear in any non-lazy chunk, when the
 * public read is missing, when `dist` is older than `src`, or when the lazy chunk does
 * not actually contain the signed-in code (a positive control, so a silent rename cannot
 * make this pass vacuously).
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** Strings that only exist in the signed-in app. */
const signedInMarkers = [
  'Record a night',
  'Instructor review',
  'Upcoming dates',
  'Continue with Google',
  'Start my practice',
];

/** Firestore paths that only the signed-in app reads or writes.
 *  Known residual: the session guide reads `sessions/{id}/guide/main`, which is built from
 *  separate path segments, so it cannot be matched as one string here. */
const signedInDataPaths = ['access_grants', 'enrolments', 'teaching_assignments', 'night_record'];

/** The one public read. Its presence also proves the entry chunk was found correctly. */
const publicDataPath = 'public_schedule';

const assetsDirectory = join('dist', 'assets');

if (!existsSync(assetsDirectory)) {
  console.error('Public bundle check failed: dist/assets is missing. Run the build first.');
  process.exit(1);
}

const newestSource = (directory) => {
  let newest = 0;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    newest = Math.max(newest, entry.isDirectory() ? newestSource(path) : statSync(path).mtimeMs);
  }
  return newest;
};

const files = readdirSync(assetsDirectory);
const entryFiles = files.filter((name) => name.startsWith('index-') && name.endsWith('.js'));
const lazyFiles = files.filter((name) => name.startsWith('LearnerAccess-') && name.endsWith('.js'));

if (entryFiles.length === 0) {
  console.error('Public bundle check failed: no entry chunk (index-*.js) was found.');
  process.exit(1);
}

if (lazyFiles.length === 0) {
  console.error('Public bundle check failed: the lazy LearnerAccess chunk is missing, so the split did not happen.');
  process.exit(1);
}

const newestAsset = Math.max(...files.map((name) => statSync(join(assetsDirectory, name)).mtimeMs));

if (newestSource(join('src')) > newestAsset) {
  console.error('Public bundle check failed: dist is older than src. Run the build before this check.');
  process.exit(1);
}

const readAll = (names) => names.map((name) => readFileSync(join(assetsDirectory, name), 'utf8')).join('\n');
const lazySource = readAll(lazyFiles);
const publicFiles = files.filter((name) => name.endsWith('.js') && !lazyFiles.includes(name));
const publicSource = readAll(publicFiles);

const leakedUi = signedInMarkers.filter((marker) => publicSource.includes(marker));
const leakedData = signedInDataPaths.filter((marker) => publicSource.includes(marker));

if (leakedUi.length > 0) {
  console.error(`Public bundle check failed: a public chunk exposes signed-in UI (${leakedUi.join(', ')}).`);
  process.exit(1);
}

if (leakedData.length > 0) {
  console.error(`Public bundle check failed: a public chunk exposes signed-in data paths (${leakedData.join(', ')}).`);
  process.exit(1);
}

if (!publicSource.includes(publicDataPath)) {
  console.error(`Public bundle check failed: the public chunks do not contain the public read (${publicDataPath}).`);
  process.exit(1);
}

const lazyHasUi = signedInMarkers.some((marker) => lazySource.includes(marker));
const lazyHasData = signedInDataPaths.some((marker) => lazySource.includes(marker));

if (!lazyHasUi || !lazyHasData) {
  console.error(
    'Public bundle check failed: the lazy chunk does not contain the signed-in app '
    + `(UI found: ${lazyHasUi}, data paths found: ${lazyHasData}). The split is misconfigured, not cleaner.`,
  );
  process.exit(1);
}

// Fonts are WOFF2-only and self-hosted. An unresolved package path in a `url()` would
// otherwise only surface as a 404 and a silent fallback to system fonts.
const cssSource = readAll(files.filter((name) => name.endsWith('.css')));

if (cssSource.includes('@fontsource/')) {
  console.error('Public bundle check failed: the built CSS still contains an unresolved @fontsource path.');
  process.exit(1);
}

const fontFiles = [...cssSource.matchAll(/url\(\/assets\/([^)"']+\.woff2)\)/g)].map((match) => match[1]);

if (fontFiles.length === 0) {
  console.error('Public bundle check failed: no self-hosted WOFF2 font is referenced by the built CSS.');
  process.exit(1);
}

const missingFonts = fontFiles.filter((name) => !files.includes(name));

if (missingFonts.length > 0) {
  console.error(`Public bundle check failed: the CSS references missing font files (${missingFonts.join(', ')}).`);
  process.exit(1);
}

const legacyFonts = files.filter((name) => name.endsWith('.woff'));

if (legacyFonts.length > 0) {
  console.error(`Public bundle check failed: legacy WOFF files are shipped (${legacyFonts.join(', ')}).`);
  process.exit(1);
}

const entryKilobytes = entryFiles
  .map((name) => readFileSync(join(assetsDirectory, name)).byteLength / 1000)
  .reduce((total, size) => total + size, 0);

console.log(
  `Public bundle check passed: entry chunk ${entryKilobytes.toFixed(2)} kB (${entryFiles.join(', ')}) and every other public `
  + `chunk carries none of the ${signedInMarkers.length} signed-in UI markers or ${signedInDataPaths.length} signed-in data `
  + `paths, still contains the ${publicDataPath} public read, and the lazy chunk (${lazyFiles.join(', ')}) holds the signed-in app. `
  + `${fontFiles.length} self-hosted WOFF2 fonts are referenced by the CSS, all present, with no legacy WOFF files.`,
);
