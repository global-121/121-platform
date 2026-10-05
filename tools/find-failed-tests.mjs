#!/usr/bin/env node

/**
 * Scans GitHub Actions runs and reports which tests fail (often).
 *
 * Requires the GitHub CLI installed and authenticated: https://cli.github.com
 * (`gh auth login`).
 *
 * Usage:
 *   node find-failed-tests.mjs --workflow=<test_service_api.yml|test_e2e_portal.yml>
 *     [--repo global-121/121-platform]
 *     [--limit 25]
 *     [--branch main]
 *     [--merge-queue-only]
 *     [--output report-failed-tests-<API|E2E>.json]
 *     [--concurrency 6]
 */

import { execFile } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { parseArgs, promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const GH_EXEC_OPTIONS = {
  // `gh run view --log` can exceed execFile's default 1MB buffer.
  maxBuffer: 50 * 1024 * 1024,
};

// Playwright's "list" reporter ends with a summary like:
//   2 failed
//     [chromium] › portal/tests/Foo.spec.ts:12:3 › some describe › some test
//   24 passed (11.9m)
// (lines are prefixed by `gh run view --log` with "<job name>\t<step>\t<timestamp> ").
const playwrightSummaryCategoryPattern =
  /(\d+) (failed|flaky|passed|skipped)\b/;
const playwrightTestEntryPattern = /\[(.+?)\]\s›\s(\S+)\s›\s(.+?)[\s─=-]*$/;

const jestFailFilePattern = /FAIL (\S+\.test\.ts)/;
const jestFailingTestPattern = /●\s+(.+)$/;

const WORKFLOWS = {
  'test_service_api.yml': {
    outputPath: `report-failed-tests-API.json`,
    // Excludes the "test-shard-resolution-api" job, which only aggregates results.
    shardJobNamePattern: /^test-shard \(/,
    parseFailingTests: parseJestFailingTests,
  },
  'test_e2e_portal.yml': {
    outputPath: `report-failed-tests-E2E.json`,
    // Excludes the "test-shard-resolution-e2e" job, which only aggregates results.
    shardJobNamePattern: /^test-shard-e2e \(/,
    parseFailingTests: parsePlaywrightFailingTests,
  },
};

const { values: args } = parseArgs({
  options: {
    repo: {
      type: 'string',
      default: 'global-121/121-platform',
    },
    workflow: {
      type: 'string',
    },
    limit: {
      type: 'string',
      default: '100',
    },
    branch: {
      type: 'string',
    },
    'merge-queue-only': {
      type: 'boolean',
      default: false,
    },
    concurrency: {
      type: 'string',
      default: '6',
    },
    output: {
      type: 'string',
    },
  },
});

const workflowConfig = WORKFLOWS[args.workflow];
if (!workflowConfig) {
  console.error(
    `Missing or unsupported --workflow. Use one of: ${Object.keys(WORKFLOWS).join(', ')}`,
  );
  process.exit(1);
}

const repo = args.repo;
const workflow = args.workflow;
const runLimit = Number(args.limit);
const concurrency = Number(args.concurrency);
const outputPath = args.output ?? workflowConfig.outputPath;

async function ghCLI({ ghArgs, returnParsedJson = false }) {
  const { stdout } = await execFileAsync('gh', ghArgs, GH_EXEC_OPTIONS);
  if (returnParsedJson) {
    return JSON.parse(stdout);
  }
  return stdout;
}

async function listCompletedRuns() {
  const listArgs = [
    'run',
    'list',
    `--repo=${repo}`,
    `--workflow=${workflow}`,
    `--limit=${runLimit}`,
    '--json',
    'databaseId,conclusion,status,createdAt,headBranch,event,headSha,url',
  ];

  if (args.branch) {
    listArgs.push(`--branch=${args.branch}`);
  }

  const runs = await ghCLI({ ghArgs: listArgs, returnParsedJson: true });
  return runs.filter((run) => {
    // NOTE: Filtering here, client-side because the GitHub API does not return recent runs when using the flag `--status=failed` consistently.
    if (run.status !== 'completed' || run.conclusion !== 'failure') {
      return false;
    }

    if (args['merge-queue-only']) {
      return run.event === 'merge_group';
    }

    return true;
  });
}

async function getShardJobs({ runId }) {
  const { jobs } = await ghCLI({
    ghArgs: ['run', 'view', String(runId), '--repo', repo, '--json', 'jobs'],
    returnParsedJson: true,
  });
  return jobs.filter(
    (job) =>
      workflowConfig.shardJobNamePattern.test(job.name) &&
      job.conclusion === 'failure',
  );
}

function parseJestFailingTests({ logText }) {
  const failingTests = new Set();
  let currentFile;

  for (const line of logText.split('\n')) {
    const failMatch = jestFailFilePattern.exec(line);
    if (failMatch) {
      currentFile = failMatch[1];
      continue;
    }

    const testMatch = jestFailingTestPattern.exec(line);
    if (testMatch && currentFile) {
      failingTests.add(`${currentFile} :: ${testMatch[1].trim()}`);
    }
  }

  return failingTests;
}

/**
 * Parses the trailing summary section that Playwright's "list" reporter
 * prints, returning the failed test entries it found there.
 */
function parsePlaywrightFailingTests({ logText }) {
  const failingTests = new Set();
  let currentCategory;

  for (const rawLine of logText.split('\n')) {
    const line = rawLine.trim();

    const categoryMatch = playwrightSummaryCategoryPattern.exec(line);
    if (categoryMatch) {
      currentCategory = categoryMatch[2];
      continue;
    }

    if (currentCategory !== 'failed') {
      continue;
    }

    const testEntryMatch = playwrightTestEntryPattern.exec(line);
    if (testEntryMatch) {
      const [, , location, title] = testEntryMatch;
      failingTests.add(`${location} :: ${title.trim()}`);
    } else if (line === '') {
      currentCategory = undefined;
    }
  }

  return failingTests;
}

async function getFailingTestsForJob({ jobId }) {
  try {
    const logText = await ghCLI({
      ghArgs: [
        'run',
        'view',
        `--repo=${repo}`,
        `--job=${jobId}`,
        '--log-failed',
      ],
    });
    return {
      failingTests: workflowConfig.parseFailingTests({ logText }),
      logAvailable: true,
    };
  } catch (error) {
    // GitHub deletes Actions logs after a retention period; treat those as unknown.
    console.warn(
      `Could not fetch logs for job ${jobId}:`,
      error?.message ?? error,
    );
    return { failingTests: new Set(), logAvailable: false };
  }
}

async function runWithConcurrency({ items, worker, maxConcurrent }) {
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

function recordOccurrences({ occurrencesByTest, testIds, run }) {
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

async function collectFailureOccurrences({ runs }) {
  const occurrencesByTest = new Map();
  let scannedRunCount = 0;
  let expiredLogCount = 0;

  await runWithConcurrency({
    items: runs,
    worker: async (run) => {
      const shardJobs = await getShardJobs({ runId: run.databaseId });
      if (shardJobs.length === 0) {
        return; // The path-filter step skipped this run entirely, or no test shards failed.
      }

      let hasFailingTests = false;

      for (const job of shardJobs) {
        const { failingTests, logAvailable } = await getFailingTestsForJob({
          jobId: job.databaseId,
        });
        if (!logAvailable) {
          expiredLogCount += 1;
          continue;
        }
        if (failingTests.size > 0) {
          hasFailingTests = true;
          recordOccurrences({ occurrencesByTest, testIds: failingTests, run });
        }
      }

      if (hasFailingTests) {
        scannedRunCount += 1;
      }
    },
    maxConcurrent: concurrency,
  });

  return {
    occurrencesByTest,
    scannedRunCount,
    expiredLogCount,
  };
}

function buildReport({ occurrencesByTest, scannedRunCount, expiredLogCount }) {
  const tests = [...occurrencesByTest.entries()].map(
    ([testId, occurrences]) => {
      const distinctRunCount = new Set(occurrences.map((o) => o.runId)).size;
      const failureRate = distinctRunCount / scannedRunCount;
      return {
        testId,
        failureCount: distinctRunCount,
        totalRunsScanned: scannedRunCount,
        failureRate: Number(failureRate.toFixed(3)),
        occurrences,
      };
    },
  );

  tests.sort(
    (a, b) => b.failureRate - a.failureRate || b.failureCount - a.failureCount,
  );

  return {
    repo,
    workflow,
    generatedAt: new Date().toISOString(),
    totalRunsScanned: scannedRunCount,
    expiredLogCount,
    tests,
  };
}

function printSummary({ report }) {
  console.log(
    `Scanned ${report.totalRunsScanned} run(s) of "${report.workflow}" in ${report.repo}.`,
  );
  console.log(`Found ${report.tests.length} failed test(s):`);

  for (const test of report.tests) {
    console.log(
      `  ${(test.failureRate * 100).toFixed(1)}% (${test.failureCount}/${test.totalRunsScanned}) — ${test.testId}`,
    );
  }

  if (report.expiredLogCount > 0) {
    console.log('\n');
    console.log(
      `${report.expiredLogCount} failed job(s) had logs already deleted by GitHub (past its retention period) and were excluded from the counts above.`,
    );
  }
}

async function main() {
  const runs = await listCompletedRuns();
  const failureOccurrences = await collectFailureOccurrences({ runs });

  const report = buildReport(failureOccurrences);
  await writeFile(outputPath, JSON.stringify(report, null, 2));

  printSummary({ report });
  console.log('\n');
  console.log(`Full report written to ${outputPath}`);
}

await main();
