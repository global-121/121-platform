#!/usr/bin/env node

/**
 * Scans GitHub Actions runs and reports which E2E-tests fail (often).
 *
 * Requires the GitHub CLI installed and authenticated: https://cli.github.com
 * (`gh auth login`).
 *
 * Usage:
 *   node find-failed-tests-E2E.mjs
 *     [--repo global-121/121-platform]
 *     [--workflow test_e2e_portal.yml]
 *     [--limit 50]
 *     [--branch main]
 *     [--merge-queue-only]
 *     [--output report-failed-tests-E2E.json]
 *     [--concurrency 8]
 */

import { writeFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';

import {
  buildReport,
  ghCLI,
  listCompletedRuns,
  printSummary,
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
      default: 'test_e2e_portal.yml',
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
      default: 'report-failed-tests-E2E.json',
    },
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
const summaryCategoryPattern = /(\d+) (failed|flaky|passed|skipped)\b/;
const testEntryPattern = /\[(.+?)\]\s›\s(\S+)\s›\s(.+?)[\s─=-]*$/;

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

/**
 * Parses the trailing summary section that Playwright's "list" reporter
 * prints, returning the failed test entries it found there.
 */
function parseFailingTests({ logText }) {
  const failingTests = new Set();
  let currentCategory;

  for (const rawLine of logText.split('\n')) {
    const line = rawLine.trim();

    const categoryMatch = summaryCategoryPattern.exec(line);
    if (categoryMatch) {
      currentCategory = categoryMatch[2];
      continue;
    }

    if (currentCategory !== 'failed') {
      continue;
    }

    const testEntryMatch = testEntryPattern.exec(line);
    if (testEntryMatch) {
      const [, project, location, title] = testEntryMatch;
      failingTests.add(`[${project}] ${location} :: ${title.trim()}`);
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
          recordOccurrences({
            occurrencesByTest,
            testIds: failingTests,
            run,
          });
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
  console.log('\n');
  console.log(`Full report written to ${args.output}`);
}

await main();
