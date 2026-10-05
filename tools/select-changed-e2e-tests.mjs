#!/usr/bin/env node

/**
 * Selects Playwright E2E spec files that changed "enough" in a pull request
 * to be worth running through the flaky-test hunter before merging:
 * - Brand-new spec files (didn't exist in the base commit) are always selected.
 * - Existing spec files are selected if the changed lines (added + deleted)
 *   make up at least `--threshold` percent of the file's current line count.
 *
 * Used by .github/workflows/test_e2e_portal.yml to decide which spec files
 * (if any) to run via `find-flaky-changed-tests`.
 *
 * Usage:
 *   node select-changed-e2e-tests.mjs --base <sha> [--head HEAD]
 *     [--threshold 10] [--max-files 15]
 */
import { execFile } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';

import { parseArgs, promisify } from 'node:util';
const execFileAsync = promisify(execFile);

const E2E_SPEC_TESTS_DIRECTORY = 'e2e/portal/tests/';

const { values: args } = parseArgs({
  options: {
    base: { type: 'string' },
    head: {
      type: 'string',
      default: 'HEAD',
    },
    threshold: {
      type: 'string',
      default: '10',
    },
    'max-files': {
      type: 'string',
      default: '15',
    },
  },
});

if (!args.base) {
  console.error('Missing required argument: --base <sha>');
  process.exit(1);
}

const threshold = Number(args.threshold);
// Bounds how many parallel Docker+Portal CI jobs a single PR can trigger.
const maxFiles = Number(args['max-files']);

async function runGit({ gitArgs, cwd }) {
  const { stdout } = await execFileAsync('git', gitArgs, { cwd });
  return stdout;
}

async function getRepositoryRoot() {
  const stdout = await runGit({ gitArgs: ['rev-parse', '--show-toplevel'] });
  return stdout.trim();
}

async function getChangedSpecFiles({ repositoryRoot, base, head }) {
  const stdout = await runGit({
    gitArgs: [
      'diff',
      '--no-renames',
      '--diff-filter=AM', // Excludes deleted paths, which no longer exist in `head` to read.
      '--numstat',
      base,
      head,
    ],
    cwd: repositoryRoot,
  });

  return stdout
    .split('\n')
    .filter((line) => line.trim() !== '')
    .map((line) => {
      const [added, deleted, path] = line.split('\t');
      return { added, deleted, path };
    })
    .filter(
      ({ added, deleted, path }) =>
        added !== '-' && // Excludes binary files, which have no line-based diff.
        deleted !== '-' &&
        path.startsWith(E2E_SPEC_TESTS_DIRECTORY) &&
        path.endsWith('.spec.ts'),
    );
}

async function isNewFile({ repositoryRoot, base, path }) {
  try {
    await runGit({
      gitArgs: ['cat-file', '-e', `${base}:${path}`],
      cwd: repositoryRoot,
    });
    return false;
  } catch {
    return true;
  }
}

function getChangePercentage({ repositoryRoot, path, added, deleted }) {
  const content = readFileSync(`${repositoryRoot}/${path}`, 'utf8');
  const totalLines = content.split('\n').length;
  if (totalLines === 0) {
    return 100;
  }

  const changedLines = Number(added) + Number(deleted);
  return (changedLines / totalLines) * 100;
}

async function selectCandidateSpecFiles({ repositoryRoot, base, head }) {
  const changedSpecFiles = await getChangedSpecFiles({
    repositoryRoot,
    base,
    head,
  });

  const candidates = [];
  for (const { added, deleted, path } of changedSpecFiles) {
    const isNew = await isNewFile({ repositoryRoot, base, path });
    if (isNew) {
      candidates.push({ path, reason: 'new file' });
      continue;
    }

    const percentage = getChangePercentage({
      repositoryRoot,
      path,
      added,
      deleted,
    });
    if (percentage >= threshold) {
      candidates.push({ path, reason: `${percentage.toFixed(1)}% changed` });
    }
  }

  return candidates;
}

function capCandidates({ candidates }) {
  if (candidates.length <= maxFiles) {
    return candidates;
  }

  console.warn(
    `Found ${candidates.length} candidate spec files, which exceeds --max-files (${maxFiles}). Only the first ${maxFiles} will be checked for flakiness.`,
  );
  return candidates.slice(0, maxFiles);
}

function toRelativePath({ path }) {
  return path.slice('e2e/'.length);
}

function writeGitHubOutput({ candidates }) {
  const files = candidates.map(({ path }) => toRelativePath({ path }));
  const hasCandidates = files.length > 0;

  const outputPath = process.env.GITHUB_OUTPUT;
  if (outputPath) {
    appendFileSync(outputPath, `files=${JSON.stringify(files)}\n`);
    appendFileSync(outputPath, `has_candidates=${hasCandidates}\n`);
  }
}

const repositoryRoot = await getRepositoryRoot();
const candidates = capCandidates({
  candidates: await selectCandidateSpecFiles({
    repositoryRoot,
    base: args.base,
    head: args.head,
  }),
});

if (candidates.length === 0) {
  console.log('No changed/new E2E spec files meet the threshold.');
} else {
  console.log('Selected E2E spec files for flaky-test detection:');
  for (const { path, reason } of candidates) {
    console.log(`  - ${path} (${reason})`);
  }
}

writeGitHubOutput({ candidates });
