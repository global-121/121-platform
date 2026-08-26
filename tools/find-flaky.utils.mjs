import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export async function ghJson({ ghArgs }) {
  const { stdout } = await execFileAsync('gh', ghArgs);
  return JSON.parse(stdout);
}

export async function ghText({ ghArgs }) {
  const { stdout } = await execFileAsync('gh', ghArgs);
  return stdout;
}

export async function listCompletedRuns({ repo, workflow, runLimit, branch }) {
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
  return runs.filter((run) => run.status === 'completed');
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
