#!/usr/bin/env node

/**
 * Scans GitHub Actions runs of the Playwright e2e workflow and reports which
 * tests are flaky (fail, then pass on Playwright's built-in retry) vs. tests
 * that fail even after retrying (likely broken, not flaky).
 *
 * Unlike Jest (see find-flaky-tests-API.mjs), Playwright is configured with
 * `retries: 1` (see e2e/playwright.config.ts), so it already tells us which
 * tests were flaky per run via its "list" reporter summary. We don't need to
 * infer flakiness statistically; we just have to aggregate it across runs.
 * Because a flaky test can still make its job conclude "success" (it passed on
 * retry), we must read the log of every completed shard job, not just the
 * failed ones.
 *
 * Requires the GitHub CLI installed and authenticated: https://cli.github.com
 * (`gh auth login`).
 *
 * Note: unlike test_service_api.yml, this workflow only triggers on
 * pull_request/merge_group (no push-to-main runs), so `--branch` usually isn't
 * useful here and is omitted by default.
 *
 * Usage:
 *   node find-flaky-tests-E2E.mjs [--workflow test_e2e_portal.yml]
 *     [--limit 200] [--branch main] [--repo global-121/121-platform]
 *     [--output report-flaky-tests-E2E.json]
 */
import { writeFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';

import {
  ghJson,
  ghText,
  listCompletedRuns,
  recordOccurrences,
  runWithConcurrency,
} from './find-flaky.utils.mjs';

const { values: args } = parseArgs({
  options: {
    repo: { type: 'string', default: 'global-121/121-platform' },
    workflow: { type: 'string', default: 'test_e2e_portal.yml' },
    limit: { type: 'string', default: '200' },
    branch: { type: 'string' },
    concurrency: { type: 'string', default: '6' },
    output: { type: 'string', default: 'report-flaky-tests-E2E.json' },
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
//   7 flaky
//     [chromium] › portal/tests/Bar.spec.ts:5:2 › another test ──────────
//   24 passed (11.9m)
// (lines are prefixed by `gh run view --log` with "<job name>\t<step>\t<timestamp> ").
const summaryCategoryPattern = /(\d+) (failed|flaky|passed|skipped)\b/;
const testEntryPattern = /\[(.+?)\]\s›\s(\S+)\s›\s(.+?)[\s─=-]*$/;

async function listCompletedRunsForWorkflow() {
  return listCompletedRuns({
    repo,
    workflow,
    runLimit,
    branch: args.branch,
  });
}

async function getShardJobs({ runId }) {
  const { jobs } = await ghJson({
    ghArgs: ['run', 'view', String(runId), '--repo', repo, '--json', 'jobs'],
  });
  return jobs.filter(
    (job) =>
      shardJobNamePattern.test(job.name) &&
      (job.conclusion === 'success' || job.conclusion === 'failure'),
  );
}

/**
 * Parses the trailing summary section that Playwright's "list" reporter
 * prints, returning the flaky and failed test entries it found there.
 */
function parseTestSummary({ logText }) {
  const testsByCategory = { failed: new Set(), flaky: new Set() };
  let currentCategory;

  for (const rawLine of logText.split('\n')) {
    const line = rawLine.trim();

    const categoryMatch = summaryCategoryPattern.exec(line);
    if (categoryMatch) {
      currentCategory = categoryMatch[2];
      continue;
    }

    if (currentCategory !== 'failed' && currentCategory !== 'flaky') {
      continue;
    }

    const testEntryMatch = testEntryPattern.exec(line);
    if (testEntryMatch) {
      const [, project, location, title] = testEntryMatch;
      testsByCategory[currentCategory].add(
        `[${project}] ${location} :: ${title.trim()}`,
      );
    } else if (line === '') {
      currentCategory = undefined;
    }
  }

  return testsByCategory;
}

async function getTestSummaryForJob({ jobId }) {
  try {
    // Use the full log (not --log-failed): a flaky test can still leave the
    // job's overall conclusion as "success" once it passes on retry.
    const logText = await ghText({
      ghArgs: ['run', 'view', '--repo', repo, '--job', String(jobId), '--log'],
    });
    return { ...parseTestSummary({ logText }), logAvailable: true };
  } catch {
    // GitHub deletes Actions logs after a retention period; treat those as unknown.
    return { failed: new Set(), flaky: new Set(), logAvailable: false };
  }
}

async function collectTestOccurrences({ runs }) {
  const flakyOccurrencesByTest = new Map();
  const failedOccurrencesByTest = new Map();
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
        const { flaky, failed, logAvailable } = await getTestSummaryForJob({
          jobId: job.databaseId,
        });
        if (!logAvailable) {
          expiredLogCount += 1;
          continue;
        }
        recordOccurrences({ occurrencesByTest: flakyOccurrencesByTest, testIds: flaky, run });
        recordOccurrences({ occurrencesByTest: failedOccurrencesByTest, testIds: failed, run });
      }
    },
    maxConcurrent: concurrency,
  });

  return {
    flakyOccurrencesByTest,
    failedOccurrencesByTest,
    scannedRunCount,
    expiredLogCount,
  };
}

function summarizeOccurrences({ occurrencesByTest, scannedRunCount }) {
  const tests = [...occurrencesByTest.entries()].map(([testId, occurrences]) => {
    const distinctRunCount = new Set(occurrences.map((o) => o.runId)).size;
    return {
      testId,
      occurrenceCount: distinctRunCount,
      totalRunsScanned: scannedRunCount,
      rate: Number((distinctRunCount / scannedRunCount).toFixed(3)),
      occurrences,
    };
  });

  tests.sort((a, b) => b.rate - a.rate || b.occurrenceCount - a.occurrenceCount);

  return tests;
}

function buildReport({
  flakyOccurrencesByTest,
  failedOccurrencesByTest,
  scannedRunCount,
  expiredLogCount,
}) {
  return {
    repo,
    workflow,
    generatedAt: new Date().toISOString(),
    totalRunsScanned: scannedRunCount,
    expiredLogCount,
    flakyTests: summarizeOccurrences({
      occurrencesByTest: flakyOccurrencesByTest,
      scannedRunCount,
    }),
    consistentlyFailingTests: summarizeOccurrences({
      occurrencesByTest: failedOccurrencesByTest,
      scannedRunCount,
    }),
  };
}

function printSummary({ report }) {
  console.log(
    `\nScanned ${report.totalRunsScanned} run(s) of "${report.workflow}" in ${report.repo}.`,
  );
  console.log(`Found ${report.flakyTests.length} flaky test(s):\n`);

  for (const test of report.flakyTests) {
    console.log(
      `  ${(test.rate * 100).toFixed(1)}% (${test.occurrenceCount}/${test.totalRunsScanned}) — ${test.testId}`,
    );
  }

  if (report.consistentlyFailingTests.length > 0) {
    console.log(
      `\n${report.consistentlyFailingTests.length} test(s) fail consistently, even after retry (likely broken, not flaky):`,
    );
    for (const test of report.consistentlyFailingTests) {
      console.log(`  ${test.testId}`);
    }
  }

  if (report.expiredLogCount > 0) {
    console.log(
      `\n${report.expiredLogCount} job(s) had logs already deleted by GitHub (past its retention period) and were excluded from the counts above.`,
    );
  }
}

async function main() {
  const runs = await listCompletedRunsForWorkflow();
  const testOccurrences = await collectTestOccurrences({ runs });

  if (testOccurrences.scannedRunCount === 0) {
    console.log('No completed runs found to analyze.');
    return;
  }

  const report = buildReport(testOccurrences);
  await writeFile(args.output, JSON.stringify(report, null, 2));

  printSummary({ report });
  console.log(`\nFull report written to ${args.output}`);
}

await main();
