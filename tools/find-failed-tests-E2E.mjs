#!/usr/bin/env node

/**
 * Scans failed GitHub Actions runs of the Playwright e2e workflow and reports
 * tests that failed after retrying.
 *
 * Requires the GitHub CLI installed and authenticated: https://cli.github.com
 * (`gh auth login`).
 *
 * Note: unlike test_service_api.yml, this workflow only triggers on
 * pull_request/merge_group (no push-to-main runs), so `--branch` usually isn't
 * useful here and is omitted by default.
 *
 * Usage:
 *   node find-failed-tests-E2E.mjs [--workflow test_e2e_portal.yml]
 *     [--limit 200] [--branch main] [--repo global-121/121-platform]
 *     [--merge-queue-only]
 *     [--output report-failed-tests-E2E.json]
 */
import { writeFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';

import {
  ghJson,
  ghText,
  listFailedRuns,
  recordOccurrences,
  runWithConcurrency,
} from './find-failed.utils.mjs';

const { values: args } = parseArgs({
  options: {
    repo: { type: 'string', default: 'global-121/121-platform' },
    workflow: { type: 'string', default: 'test_e2e_portal.yml' },
    limit: { type: 'string', default: '200' },
    branch: { type: 'string' },
    'merge-queue-only': { type: 'boolean', default: false },
    concurrency: { type: 'string', default: '6' },
    output: { type: 'string', default: 'report-failed-tests-E2E.json' },
  },
});

const repo = args.repo;
const workflow = args.workflow;
const runLimit = Number(args.limit);
const concurrency = Number(args.concurrency);
// Excludes the "test-shard-resolution-e2e" job, which only aggregates results.
const shardJobNamePattern = /^test-shard-e2e \(/;
// Playwright's "list" reporter ends with a summary like:
//   2 failed
//     [chromium] › portal/tests/Foo.spec.ts:12:3 › some describe › some test
//   24 passed (11.9m)
// (lines are prefixed by `gh run view --log` with "<job name>\t<step>\t<timestamp> ").
const summaryCategoryPattern = /\b\d+ ([a-z]+)(?: \([^)]+\))?$/;
const testEntryPattern = /\[(.+?)\]\s›\s(\S+)\s›\s(.+?)[\s─=-]*$/;

async function listFailedRunsForWorkflow() {
  return listFailedRuns({
    repo,
    workflow,
    runLimit,
    branch: args.branch,
    mergeQueueOnly: args['merge-queue-only'],
  });
}

async function getShardJobs({ runId }) {
  const { jobs } = await ghJson({
    ghArgs: ['run', 'view', String(runId), '--repo', repo, '--json', 'jobs'],
  });
  return jobs.filter(
    (job) => shardJobNamePattern.test(job.name) && job.conclusion === 'failure',
  );
}

/**
 * Parses the trailing summary section that Playwright's "list" reporter
 * prints, returning the failed test entries it found there.
 */
function parseTestSummary({ logText }) {
  const failedTests = new Set();
  let currentCategory;

  for (const rawLine of logText.split('\n')) {
    const line = rawLine.trim();

    const categoryMatch = summaryCategoryPattern.exec(line);
    if (categoryMatch) {
      currentCategory = categoryMatch[1];
      continue;
    }

    if (currentCategory !== 'failed') {
      continue;
    }

    const testEntryMatch = testEntryPattern.exec(line);
    if (testEntryMatch) {
      const [, project, location, title] = testEntryMatch;
      failedTests.add(`[${project}] ${location} :: ${title.trim()}`);
    } else if (line === '') {
      currentCategory = undefined;
    }
  }

  return failedTests;
}

async function getFailedTestsForJob({ jobId }) {
  try {
    const logText = await ghText({
      ghArgs: ['run', 'view', '--repo', repo, '--job', String(jobId), '--log'],
    });
    return {
      failedTests: parseTestSummary({ logText }),
      logAvailable: true,
    };
  } catch (error) {
    // GitHub deletes Actions logs after a retention period; treat those as unknown.
    console.warn(
      `Could not fetch logs for job ${jobId}:`,
      error?.message ?? error,
    );
    return { failedTests: new Set(), logAvailable: false };
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
        return; // The path-filter step skipped this run entirely.
      }
      scannedRunCount += 1;

      for (const job of shardJobs) {
        const { failedTests, logAvailable } = await getFailedTestsForJob({
          jobId: job.databaseId,
        });
        if (!logAvailable) {
          expiredLogCount += 1;
          continue;
        }
        recordOccurrences({ occurrencesByTest, testIds: failedTests, run });
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

function summarizeOccurrences({ occurrencesByTest, scannedRunCount }) {
  const tests = [...occurrencesByTest.entries()].map(
    ([testId, occurrences]) => {
      const distinctRunCount = new Set(occurrences.map((o) => o.runId)).size;
      return {
        testId,
        failureCount: distinctRunCount,
        totalRunsScanned: scannedRunCount,
        occurrences,
      };
    },
  );

  tests.sort((a, b) => b.failureCount - a.failureCount);

  return tests;
}

function buildReport({ occurrencesByTest, scannedRunCount, expiredLogCount }) {
  return {
    repo,
    workflow,
    generatedAt: new Date().toISOString(),
    totalRunsScanned: scannedRunCount,
    expiredLogCount,
    tests: summarizeOccurrences({
      occurrencesByTest,
      scannedRunCount,
    }),
  };
}

function printSummary({ report }) {
  console.log(
    `\nScanned ${report.totalRunsScanned} failed run(s) of "${report.workflow}" in ${report.repo}.`,
  );
  console.log(`Found ${report.tests.length} failed test(s):\n`);

  for (const test of report.tests) {
    console.log(
      `  ${test.failureCount}/${test.totalRunsScanned} failed runs — ${test.testId}`,
    );
  }

  if (report.expiredLogCount > 0) {
    console.log(
      `\n${report.expiredLogCount} job(s) had logs already deleted by GitHub (past its retention period) and were excluded from the counts above.`,
    );
  }
}

async function main() {
  const runs = await listFailedRunsForWorkflow();
  const failureOccurrences = await collectFailureOccurrences({ runs });

  if (failureOccurrences.scannedRunCount === 0) {
    console.log('No failed runs found to analyze.');
    return;
  }

  const report = buildReport(failureOccurrences);
  await writeFile(args.output, JSON.stringify(report, null, 2));

  printSummary({ report });
  console.log(`\nFull report written to ${args.output}`);
}

await main();
