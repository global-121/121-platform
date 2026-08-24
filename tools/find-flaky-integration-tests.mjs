#!/usr/bin/env node

/**
 * Scans GitHub Actions runs of a Jest-based test workflow and reports which
 * integration tests fail intermittently (flaky) vs. consistently (broken).
 *
 * Requires the GitHub CLI installed and authenticated: https://cli.github.com
 * (`gh auth login`).
 *
 * Usage:
 *   node find-flaky-integration-tests.mjs [--workflow test_service_api.yml]
 *     [--limit 200] [--branch main] [--repo global-121/121-platform]
 *     [--output flaky-integration-report.json]
 */
import { execFile } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { parseArgs, promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const { values: args } = parseArgs({
  options: {
    repo: { type: 'string', default: 'global-121/121-platform' },
    workflow: { type: 'string', default: 'test_service_api.yml' },
    limit: { type: 'string', default: '200' },
    branch: { type: 'string' },
    concurrency: { type: 'string', default: '6' },
    output: { type: 'string', default: 'flaky-integration-report.json' },
  },
});

const repo = args.repo;
const workflow = args.workflow;
const runLimit = Number(args.limit);
const concurrency = Number(args.concurrency);
// Excludes the "test-shard-resolution-api" job, which only aggregates results.
const shardJobNamePattern = /^test-shard \(/;
const failFilePattern = /FAIL (\S+\.test\.ts)/;
const failingTestPattern = /●\s+(.+)$/;

async function ghJson(ghArgs) {
  const { stdout } = await execFileAsync('gh', ghArgs);
  return JSON.parse(stdout);
}

async function ghText(ghArgs) {
  const { stdout } = await execFileAsync('gh', ghArgs);
  return stdout;
}

async function listCompletedRuns() {
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
  if (args.branch) {
    listArgs.push('--branch', args.branch);
  }

  const runs = await ghJson(listArgs);
  return runs.filter((run) => run.status === 'completed');
}

async function getShardJobs(runId) {
  const { jobs } = await ghJson([
    'run',
    'view',
    String(runId),
    '--repo',
    repo,
    '--json',
    'jobs',
  ]);
  return jobs.filter((job) => shardJobNamePattern.test(job.name));
}

function parseFailingTests(logText) {
  const failingTests = new Set();
  let currentFile;

  for (const line of logText.split('\n')) {
    const failMatch = failFilePattern.exec(line);
    if (failMatch) {
      currentFile = failMatch[1];
      continue;
    }

    const testMatch = failingTestPattern.exec(line);
    if (testMatch && currentFile) {
      failingTests.add(`${currentFile} :: ${testMatch[1].trim()}`);
    }
  }

  return failingTests;
}

async function getFailingTestsForJob(jobId) {
  try {
    const logText = await ghText([
      'run',
      'view',
      '--repo',
      repo,
      '--job',
      String(jobId),
      '--log-failed',
    ]);
    return { failingTests: parseFailingTests(logText), logAvailable: true };
  } catch {
    // GitHub deletes Actions logs after a retention period; treat those as unknown.
    return { failingTests: new Set(), logAvailable: false };
  }
}

async function runWithConcurrency(items, worker, maxConcurrent) {
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

async function collectFailureOccurrences(runs) {
  const occurrencesByTest = new Map();
  let scannedRunCount = 0;
  let expiredLogCount = 0;

  await runWithConcurrency(
    runs,
    async (run) => {
      const shardJobs = await getShardJobs(run.databaseId);
      if (shardJobs.length === 0) {
        return; // The path-filter step skipped this run entirely.
      }
      scannedRunCount += 1;

      const failedShardJobs = shardJobs.filter(
        (job) => job.conclusion === 'failure',
      );

      for (const job of failedShardJobs) {
        const { failingTests, logAvailable } = await getFailingTestsForJob(
          job.databaseId,
        );
        if (!logAvailable) {
          expiredLogCount += 1;
          continue;
        }
        for (const testId of failingTests) {
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
    },
    concurrency,
  );

  return { occurrencesByTest, scannedRunCount, expiredLogCount };
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
        // Peaks at a 50% failure rate (most unpredictable); 0 at either extreme.
        flakinessScore: Number((failureRate * (1 - failureRate)).toFixed(4)),
        // A test failing in (almost) every run is broken, not flaky.
        classification: failureRate >= 0.95 ? 'consistently-failing' : 'flaky',
        occurrences,
      };
    },
  );

  tests.sort(
    (a, b) =>
      b.flakinessScore - a.flakinessScore || b.failureCount - a.failureCount,
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

function printSummary(report) {
  // report.tests is already ordered by flakiness score (most unpredictable first).
  const flakyTests = report.tests.filter(
    (test) => test.classification === 'flaky',
  );
  // Broken tests aren't unpredictable, so rank them by how often they fail instead.
  const brokenTests = report.tests
    .filter((test) => test.classification === 'consistently-failing')
    .sort((a, b) => b.failureRate - a.failureRate);

  console.log(
    `\nScanned ${report.totalRunsScanned} run(s) of "${report.workflow}" in ${report.repo}.`,
  );
  console.log(`Found ${flakyTests.length} flaky test(s):\n`);

  for (const test of flakyTests) {
    console.log(
      `  ${(test.failureRate * 100).toFixed(1)}% (${test.failureCount}/${test.totalRunsScanned}) — ${test.testId}`,
    );
  }

  if (brokenTests.length > 0) {
    console.log(
      `\n${brokenTests.length} test(s) fail consistently (likely broken, not flaky):`,
    );
    for (const test of brokenTests) {
      console.log(`  ${test.testId}`);
    }
  }

  if (report.expiredLogCount > 0) {
    console.log(
      `\n${report.expiredLogCount} failed job(s) had logs already deleted by GitHub (past its retention period) and were excluded from the counts above.`,
    );
  }
}

async function main() {
  const runs = await listCompletedRuns();
  const failureOccurrences = await collectFailureOccurrences(runs);

  if (failureOccurrences.scannedRunCount === 0) {
    console.log('No completed runs found to analyze.');
    return;
  }

  const report = buildReport(failureOccurrences);
  await writeFile(args.output, JSON.stringify(report, null, 2));

  printSummary(report);
  console.log(`\nFull report written to ${args.output}`);
}

await main();
