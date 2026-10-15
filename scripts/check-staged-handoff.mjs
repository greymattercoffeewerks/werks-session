import { execFileSync } from 'node:child_process';

const stagedFiles = execFileSync('git', ['diff', '--cached', '--name-only'], { encoding: 'utf8' })
  .split(/\r?\n/)
  .filter(Boolean);

if (!stagedFiles.includes('docs/SESSION_HANDOFF.md')) {
  console.error('Commit blocked: stage an updated docs/SESSION_HANDOFF.md before committing.');
  process.exit(1);
}
