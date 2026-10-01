#!/usr/bin/env node

/**
 * Scans failed GitHub Actions runs of a Jest-based test workflow and reports
 * which integration tests failed.
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
 */
import { writeFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';

import {
  buildReport,
  ghCLI,
  listFailedRuns,
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

async function getShardJobs({ runId }) {
  const { jobs } = await ghCLI({
    ghArgs: ['run', 'view', String(runId), '--repo', repo, '--json', 'jobs'],
    returnParsedJson: true,
  });
  return jobs.filter((job) => shardJobNamePattern.test(job.name));
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

async function getFailedTestsForJob({ jobId }) {
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
      failedTests: parseFailingTests({ logText }),
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
      const failedShardJobs = shardJobs.filter(
        (job) => job.conclusion === 'failure',
      );
      if (failedShardJobs.length === 0) {
        return;
      }
      scannedRunCount += 1;

      for (const job of failedShardJobs) {
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

  return { occurrencesByTest, scannedRunCount, expiredLogCount };
}

async function main() {
  const runs = await listFailedRuns({
    repo,
    workflow,
    runLimit,
    branch: args.branch,
    mergeQueueOnly: args['merge-queue-only'],
  });
  const failureOccurrences = await collectFailureOccurrences({ runs });

  if (failureOccurrences.scannedRunCount === 0) {
    console.log('No failed runs found to analyze.');
    return;
  }

  const report = buildReport({
    repo,
    workflow,
    ...failureOccurrences,
  });
  await writeFile(args.output, JSON.stringify(report, null, 2));

  printSummary({ report });
  console.log(`\n`);
  console.log(`Full report written to ${args.output}`);
}

await main();
