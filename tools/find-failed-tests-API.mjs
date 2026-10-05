#!/usr/bin/env node

/**
 * Scans GitHub Actions runs and reports which API/integration-tests fail (often).
 *
 * Requires the GitHub CLI installed and authenticated: https://cli.github.com
 * (`gh auth login`).
 *
 * Usage:
 *   node find-failed-tests-API.mjs
 *     [--repo global-121/121-platform]
 *     [--workflow test_service_api.yml]
 *     [--limit 50]
 *     [--branch main]
 *     [--merge-queue-only]
 *     [--output report-failed-tests-API.json]
 *     [--concurrency 8]
 */

import { writeFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';

import {
  ghCLI,
  listCompletedRuns,
  recordOccurrences,
  runWithConcurrency,
} from './find-failed.utils.mjs';

const { values: args } = parseArgs({
  options: {
    repo: {
      type: 'string',
      default: 'global-121/121-platform',
    },
    workflow: {
      type: 'string',
      default: 'test_service_api.yml',
    },
    limit: {
      type: 'string',
      default: '25',
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
      default: 'report-failed-tests-API.json',
    },
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

async function listCompletedRunsForWorkflow() {
  return listCompletedRuns({
    repo,
    workflow,
    runLimit,
    branch: args.branch,
    mergeQueueOnly: args['merge-queue-only'],
  });
}

async function getShardJobs({ runId }) {
  const { jobs } = await ghCLI({
    ghArgs: ['run', 'view', String(runId), '--repo', repo, '--json', 'jobs'],
    returnParsedJson: true,
  });
  return jobs.filter(
    (job) => shardJobNamePattern.test(job.name) && job.conclusion === 'failure',
  );
}

function parseFailingTests({ logText }) {
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

async function getFailingTestsForJob({ jobId }) {
  try {
    const logText = await ghCLI({
      ghArgs: [
        'run',
        'view',
        '--repo',
        repo,
        '--job',
        String(jobId),
        '--log-failed',
      ],
    });
    return {
      failingTests: parseFailingTests({ logText }),
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
    `\nScanned ${report.totalRunsScanned} run(s) of "${report.workflow}" in ${report.repo}.`,
  );
  console.log(`Found ${report.tests.length} failed test(s):\n`);

  for (const test of report.tests) {
    console.log(
      `  ${(test.failureRate * 100).toFixed(1)}% (${test.failureCount}/${test.totalRunsScanned}) — ${test.testId}`,
    );
  }

  if (report.expiredLogCount > 0) {
    console.log(
      `\n${report.expiredLogCount} failed job(s) had logs already deleted by GitHub (past its retention period) and were excluded from the counts above.`,
    );
  }
}

async function main() {
  const runs = await listCompletedRunsForWorkflow();
  const failureOccurrences = await collectFailureOccurrences({ runs });

  if (failureOccurrences.scannedRunCount === 0) {
    console.log('No completed runs found to analyze.');
    return;
  }

  const report = buildReport(failureOccurrences);
  await writeFile(args.output, JSON.stringify(report, null, 2));

  printSummary({ report });
  console.log(`\nFull report written to ${args.output}`);
}

await main();
