// Aggregates per-run `failed-tests.json` artifacts (downloaded from recent
// workflow runs) into a single `flaky-tests.json` flakiness report.

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const runsListPath = process.argv[2] ?? 'runs.json';
const downloadsDir = process.argv[3] ?? 'downloads';
const outputPath = process.argv[4] ?? 'flaky-tests.json';
const windowDays = Number(process.argv[5] ?? 90);

const isWithinWindow = ({ createdAt, referenceDate, windowDays: days }) => {
  const ageInDays =
    (referenceDate.getTime() - new Date(createdAt).getTime()) /
    (24 * 60 * 60 * 1000);
  return ageInDays <= days;
};

const readFailedTestsForRun = async ({ run, downloadsDirectory }) => {
  const filePath = path.join(
    downloadsDirectory,
    String(run.databaseId),
    'failed-tests.json',
  );

  try {
    return JSON.parse(await readFile(filePath, 'utf8'));
  } catch {
    // No artifact for this run (e.g. it predates flaky-tracking, or was never uploaded).
    return null;
  }
};

export const aggregateFlakyTests = async ({
  runs,
  downloadsDirectory,
  windowDays: days,
  referenceDate = new Date(),
}) => {
  const runsInWindow = runs.filter((run) =>
    isWithinWindow({
      createdAt: run.createdAt,
      referenceDate,
      windowDays: days,
    }),
  );

  const testsById = new Map();

  for (const run of runsInWindow) {
    const flakyTests = await readFailedTestsForRun({
      run,
      downloadsDirectory,
    });
    if (!flakyTests) {
      continue;
    }

    for (const flakyTest of flakyTests) {
      const existing = testsById.get(flakyTest.testId) ?? {
        testId: flakyTest.testId,
        title: flakyTest.title,
        file: flakyTest.file,
        project: flakyTest.project,
        failures: 0,
        lastFailed: null,
        lastFailedRunUrl: null,
      };

      existing.failures += 1;
      if (!existing.lastFailed || run.createdAt > existing.lastFailed) {
        existing.lastFailed = run.createdAt;
        existing.lastFailedRunUrl = run.url;
      }

      testsById.set(flakyTest.testId, existing);
    }
  }

  const totalRunsAnalyzed = runsInWindow.length;
  const tests = [...testsById.values()].map((test) => ({
    ...test,
    flakinessRatePercent: totalRunsAnalyzed
      ? Math.round((test.failures / totalRunsAnalyzed) * 10_000) / 100
      : 0,
  }));

  const files = new Map();
  for (const test of tests) {
    const existingFile = files.get(test.file) ?? {
      failures: 0,
      lastFailed: null,
      tests: [],
    };

    existingFile.failures += test.failures;
    if (!existingFile.lastFailed || test.lastFailed > existingFile.lastFailed) {
      existingFile.lastFailed = test.lastFailed;
    }
    existingFile.tests.push(test);

    files.set(test.file, existingFile);
  }

  const sortedFiles = Object.fromEntries(
    [...files.entries()]
      .sort(([, a], [, b]) => b.failures - a.failures)
      .map(([file, fileReport]) => [
        file,
        {
          ...fileReport,
          tests: fileReport.tests.sort((a, b) => b.failures - a.failures),
        },
      ]),
  );

  return {
    generatedAt: referenceDate.toISOString(),
    windowDays: days,
    totalRunsAnalyzed,
    files: sortedFiles,
  };
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const runs = JSON.parse(await readFile(runsListPath, 'utf8'));
  const report = await aggregateFlakyTests({
    runs,
    downloadsDirectory: downloadsDir,
    windowDays,
  });
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
}
