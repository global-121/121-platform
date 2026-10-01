import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const GH_EXEC_OPTIONS = {
  // `gh run view --log` can exceed execFile's default 1MB buffer.
  maxBuffer: 50 * 1024 * 1024,
};

export async function ghCLI({ ghArgs, returnParsedJson = false }) {
  const { stdout } = await execFileAsync('gh', ghArgs, GH_EXEC_OPTIONS);
  if (returnParsedJson) {
    return JSON.parse(stdout);
  }
  return stdout;
}

export async function listFailedRuns({
  repo,
  workflow,
  runLimit,
  branch,
  mergeQueueOnly = false,
}) {
  const listArgs = [
    'run',
    'list',
    `--repo=${repo}`,
    `--workflow=${workflow}`,
    '--status=failure',
    `-L=${runLimit}`,
    '--json=databaseId,createdAt,headBranch,event,headSha,url',
  ];

  if (mergeQueueOnly) {
    listArgs.push('--event=merge_group');
  }

  if (branch) {
    listArgs.push(`--branch=${branch}`);
  }

  return await ghCLI({
    ghArgs: listArgs,
    returnParsedJson: true,
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

export function buildReport({
  repo,
  workflow,
  occurrencesByTest,
  scannedRunCount,
  expiredLogCount,
}) {
  const tests = [...occurrencesByTest.entries()].map(
    ([testId, occurrences]) => {
      const distinctRunCount = new Set(
        occurrences.map((occurrence) => occurrence.runId),
      ).size;
      return {
        testId,
        failureCount: distinctRunCount,
        totalRunsScanned: scannedRunCount,
        occurrences,
      };
    },
  );

  tests.sort((a, b) => b.failureCount - a.failureCount);

  return {
    repo,
    workflow,
    generatedAt: new Date().toISOString(),
    totalRunsScanned: scannedRunCount,
    expiredLogCount,
    tests,
  };
}

export function printSummary({ report }) {
  console.log(
    `Scanned ${report.totalRunsScanned} failed run(s) of "${report.workflow}" in ${report.repo}.`,
  );
  console.log(`Found ${report.tests.length} failed test(s):`);
  console.log(`\n`);

  for (const test of report.tests) {
    console.log(
      `  ${test.failureCount}/${test.totalRunsScanned} failed runs — ${test.testId}`,
    );
  }

  if (report.expiredLogCount > 0) {
    console.log(`\n`);
    console.log(
      `${report.expiredLogCount} job(s) had logs already deleted by GitHub (past its retention period) and were excluded from the counts above.`,
    );
  }
}
