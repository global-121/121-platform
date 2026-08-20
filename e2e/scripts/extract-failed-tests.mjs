// Reads a Playwright JSON-reporter report and extracts only the "flaky" tests
// (tests that failed at least once but ultimately passed on retry) into a
// small, normalized report used for cross-run flakiness tracking.

import { readFile, writeFile } from 'node:fs/promises';

const inputPath = process.argv[2] ?? 'test-results/results.json';
const outputPath = process.argv[3] ?? 'test-results/failed-tests.json';

// CI-provided metadata, not managed via the env.ts file
const runMetadata = {
  runId: process.env.GITHUB_RUN_ID ?? null, // eslint-disable-line n/no-process-env -- See comment.
  runNumber: process.env.GITHUB_RUN_NUMBER ?? null, // eslint-disable-line n/no-process-env -- See comment.
  runAttempt: process.env.GITHUB_RUN_ATTEMPT ?? null, // eslint-disable-line n/no-process-env -- See comment.
  sha: process.env.GITHUB_SHA ?? null, // eslint-disable-line n/no-process-env -- See comment.
  ref: process.env.GITHUB_REF_NAME ?? null, // eslint-disable-line n/no-process-env -- See comment.
  shard: process.env.TEST_SHARD ?? null, // eslint-disable-line n/no-process-env -- See comment.
};

const extractErrorMessages = ({ results }) => {
  return results
    .flatMap((result) => result.errors ?? (result.error ? [result.error] : []))
    .map((error) => error.message)
    .filter(Boolean);
};

const collectFlakyTests = ({ suite, titlePath }) => {
  const flakyTests = [];

  for (const spec of suite.specs ?? []) {
    for (const test of spec.tests ?? []) {
      if (test.status !== 'flaky') {
        continue;
      }

      flakyTests.push({
        testId: [...titlePath, spec.title].join(' > '),
        title: spec.title,
        titlePath: [...titlePath, spec.title],
        file: spec.file,
        project: test.projectName,
        retries: test.results.length - 1,
        durationMs: test.results.at(-1)?.duration ?? null,
        errors: extractErrorMessages(test),
        ...runMetadata,
        timestamp: new Date().toISOString(),
      });
    }
  }

  for (const childSuite of suite.suites ?? []) {
    flakyTests.push(
      ...collectFlakyTests({
        suite: childSuite,
        titlePath: [...titlePath, childSuite.title].filter(Boolean),
      }),
    );
  }

  return flakyTests;
};

export const extractFailedTests = async ({ inputFilePath, outputFilePath }) => {
  let report;
  try {
    report = JSON.parse(await readFile(inputFilePath, 'utf8'));
  } catch {
    // No report available (e.g. Playwright crashed before writing it): emit an empty report.
    await writeFile(outputFilePath, '[]\n');
    return [];
  }

  const flakyTests = (report.suites ?? []).flatMap((suite) =>
    collectFlakyTests({ suite, titlePath: [] }),
  );

  await writeFile(outputFilePath, `${JSON.stringify(flakyTests, null, 2)}\n`);
  return flakyTests;
};

if (import.meta.url === `file://${process.argv[1]}`) {
  await extractFailedTests({
    inputFilePath: inputPath,
    outputFilePath: outputPath,
  });
}
