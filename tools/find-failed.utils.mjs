import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const GH_EXEC_OPTIONS = {
  // `gh run view --log` can exceed execFile's default 1MB buffer.
  maxBuffer: 50 * 1024 * 1024,
};

export async function ghJson({ ghArgs }) {
  const { stdout } = await execFileAsync('gh', ghArgs, GH_EXEC_OPTIONS);
  return JSON.parse(stdout);
}

export async function ghText({ ghArgs }) {
  const { stdout } = await execFileAsync('gh', ghArgs, GH_EXEC_OPTIONS);
  return stdout;
}

export async function listCompletedRuns({
  repo,
  workflow,
  runLimit,
  branch,
  mergeQueueOnly = false,
}) {
  const listArgs = [
    'run',
    'list',
    '--repo',
    repo,
    '--workflow',
    workflow,
    '-L',
    String(runLimit),
    '--json',
    'databaseId,conclusion,status,createdAt,headBranch,event,headSha,url',
  ];
  if (branch) {
    listArgs.push('--branch', branch);
  }

  const runs = await ghJson({ ghArgs: listArgs });
  return runs.filter((run) => {
    if (run.status !== 'completed') {
      return false;
    }

    if (!mergeQueueOnly) {
      return true;
    }

    return run.event === 'merge_group';
  });
}

export async function runWithConcurrency({ items, worker, maxConcurrent }) {
  let nextIndex = 0;

  async function runNext() {
    const index = nextIndex++;
    if (index >= items.length) {
      return;
    }
    await worker(items[index]);
    await runNext();
  }

  await Promise.all(
    Array.from({ length: Math.min(maxConcurrent, items.length) }, runNext),
  );
}

export function recordOccurrences({ occurrencesByTest, testIds, run }) {
  for (const testId of testIds) {
    const occurrences = occurrencesByTest.get(testId) ?? [];
    occurrences.push({
      runId: run.databaseId,
      headSha: run.headSha,
      headBranch: run.headBranch,
      event: run.event,
      createdAt: run.createdAt,
      url: run.url,
    });
    occurrencesByTest.set(testId, occurrences);
  }
}
