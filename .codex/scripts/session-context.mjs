import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const files = [
  'CONVENTIONS.md',
  'docs/PROJECT_MEMORY.md',
  'docs/DECISIONS.md',
  'docs/SESSION_HANDOFF.md',
];

function read(path) {
  try {
    return readFileSync(path, 'utf8').trim();
  } catch {
    return `[Missing required context: ${path}]`;
  }
}

function git(args) {
  try {
    return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() || '(clean)';
  } catch {
    return '(unavailable)';
  }
}

const status = git(['status', '--short']);
console.log(['# Grey Matter Education Portal session context', ...files.map((file) => `\n## ${file}\n${read(file)}`), `\n## Working tree\n${status}`].join('\n'));
