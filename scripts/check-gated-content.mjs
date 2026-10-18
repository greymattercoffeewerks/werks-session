import { execFileSync } from 'node:child_process';

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

if (violations.length > 0 || unignored.length > 0) {
  console.error('Gated-content check failed.');
  for (const violation of violations) console.error(`  tracked gated file: ${violation}`);
  for (const path of unignored) console.error(`  .gitignore no longer covers: ${path}`);
  console.error('Keep learner-gated material out of this public repository. Remove it from the index with `git rm --cached` and keep it in the gitignored content-drafts/ folder.');
  process.exit(1);
}

console.log(`Gated-content check passed: ${tracked.length} tracked files, none gated; ${sampleGatedPaths.length} gated sample paths ignored.`);
