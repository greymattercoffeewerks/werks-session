import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Guards the public repository against learner-gated material. It checks Git's own view of the
// tree, so it cannot be satisfied by a file that is merely absent from the working directory.
const tracked = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);

const allowedPlaceholders = new Set(['Handoff and Planning Docs/README.md', 'content-drafts/README.md']);
const gatedPatterns = [
  { label: 'planning or course-work folder', test: (path) => path.startsWith('Handoff and Planning Docs/') || path.startsWith('content-drafts/') },
  { label: 'gated folder', test: (path) => path.startsWith('gated/') },
  { label: 'GMCW course document', test: (path) => /(^|\/)GMCW_/.test(path) },
  { label: 'guide, seed, or gated file', test: (path) => /(student-guide|table-guide|guide-seed|\.gated\.)/i.test(path) },
  { label: 'PDF or archive', test: (path) => /\.(pdf|zip)$/i.test(path) },
];

const violations = [];
for (const path of tracked) {
  if (allowedPlaceholders.has(path)) continue;
  const match = gatedPatterns.find((pattern) => pattern.test(path));
  if (match) violations.push(`${path} (${match.label})`);
}

// Every rule above must also be enforced by .gitignore so such a file cannot be staged by accident.
const sampleGatedPaths = [
  'gated/guide.json',
  'content-drafts/example.md',
  'Handoff and Planning Docs/GMCW_Example.md',
  'docs/public-cupping-student-guide.html',
  'docs/table-guide.md',
  'tools/guide-seed.json',
  'notes/example.gated.json',
  'export/guide.pdf',
  'export/materials.zip',
];
const unignored = sampleGatedPaths.filter((path) => {
  try {
    execFileSync('git', ['check-ignore', '-q', '--no-index', '--', path]);
    return false;
  } catch {
    return true;
  }
});

// Optional private check. content-drafts/gated-markers.txt is gitignored and lists words or phrases that
// must never appear in this repository (one per line, '#' for comments). CI skips it because the file
// is absent there, and marker text is never printed, so public CI logs cannot leak it.
const markerFile = 'content-drafts/gated-markers.txt';
const markers = existsSync(markerFile)
  ? readFileSync(markerFile, 'utf8').split(String.fromCharCode(10)).map((line) => line.trim().toLowerCase()).filter((line) => line && !line.startsWith('#'))
  : [];
const markerHits = [];
if (markers.length > 0) {
  const textFile = /\.(md|ts|tsx|js|mjs|cjs|json|css|html|yml|yaml|txt)$/i;
  const scan = (path) => {
    let content;
    try {
      content = readFileSync(path, 'utf8').toLowerCase();
    } catch {
      return;
    }
    markers.forEach((marker, index) => {
      if (content.includes(marker)) markerHits.push(`${path} (private marker #${index + 1})`);
    });
  };
  tracked.filter((path) => textFile.test(path)).forEach(scan);
  const walk = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (textFile.test(entry.name)) scan(path);
    }
  };
  if (existsSync('dist')) walk('dist');
}

if (violations.length > 0 || unignored.length > 0 || markerHits.length > 0) {
  console.error('Gated-content check failed.');
  for (const violation of violations) console.error(`  tracked gated file: ${violation}`);
  for (const path of unignored) console.error(`  .gitignore no longer covers: ${path}`);
  for (const hit of markerHits) console.error(`  gated text found: ${hit}`);
  console.error('Keep learner-gated material out of this public repository. Remove it from the index with `git rm --cached` and keep it in the gitignored content-drafts/ folder.');
  process.exit(1);
}

console.log(`Gated-content check passed: ${tracked.length} tracked files, none gated; ${sampleGatedPaths.length} gated sample paths ignored; ${markers.length > 0 ? `${markers.length} private markers absent from tracked files and dist/` : 'private marker check skipped (no content-drafts/gated-markers.txt)'}.`);
