import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { aggregateFlakyTests } from './aggregate-flaky-tests.mjs';

const createTempDir = async ({ t }) => {
  const directory = await mkdtemp(path.join(tmpdir(), 'aggregate-tests-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return directory;
};

const writeRunArtifact = async ({ downloadsDirectory, runId, flakyTests }) => {
  const runDirectory = path.join(downloadsDirectory, String(runId));
  await mkdir(runDirectory, { recursive: true });
  await writeFile(
    path.join(runDirectory, 'failed-tests.json'),
    JSON.stringify(flakyTests),
  );
};

test('groups by file and computes flakiness rate over total analyzed runs', async (t) => {
  const downloadsDirectory = await createTempDir({ t });
  const referenceDate = new Date('2026-08-20T00:00:00.000Z');
  const runs = [
    {
      databaseId: 1,
      createdAt: '2026-08-19T00:00:00.000Z',
      url: 'https://example.com/runs/1',
    },
    {
      databaseId: 2,
      createdAt: '2026-08-18T00:00:00.000Z',
      url: 'https://example.com/runs/2',
    },
    {
      databaseId: 3,
      createdAt: '2026-08-17T00:00:00.000Z',
      url: 'https://example.com/runs/3',
    },
  ];

  const flakyTest = {
    testId: 'Login > logs in',
    title: 'logs in',
    file: 'login.spec.ts',
  };
  await writeRunArtifact({
    downloadsDirectory,
    runId: 1,
    flakyTests: [flakyTest],
  });
  await writeRunArtifact({
    downloadsDirectory,
    runId: 2,
    flakyTests: [flakyTest],
  });
  // Run 3 has no artifact at all (e.g. predates flaky-tracking).

  const report = await aggregateFlakyTests({
    runs,
    downloadsDirectory,
    windowDays: 90,
    referenceDate,
  });

  assert.equal(report.totalRunsAnalyzed, 3);
  const fileReport = report.files['login.spec.ts'];
  assert.equal(fileReport.failures, 2);
  assert.equal(fileReport.lastFailed, '2026-08-19T00:00:00.000Z');
  assert.equal(fileReport.tests.length, 1);
  assert.equal(fileReport.tests[0].failures, 2);
  assert.equal(fileReport.tests[0].flakinessRatePercent, 66.67);
  assert.equal(
    fileReport.tests[0].lastFailedRunUrl,
    'https://example.com/runs/1',
  );
});

test('excludes runs outside the aggregation window', async (t) => {
  const downloadsDirectory = await createTempDir({ t });
  const referenceDate = new Date('2026-08-20T00:00:00.000Z');
  const runs = [
    {
      databaseId: 1,
      createdAt: '2026-08-19T00:00:00.000Z',
      url: 'https://example.com/runs/1',
    },
    {
      databaseId: 2,
      createdAt: '2025-01-01T00:00:00.000Z',
      url: 'https://example.com/runs/2',
    },
  ];

  await writeRunArtifact({
    downloadsDirectory,
    runId: 2,
    flakyTests: [
      { testId: 'Login > logs in', title: 'logs in', file: 'login.spec.ts' },
    ],
  });

  const report = await aggregateFlakyTests({
    runs,
    downloadsDirectory,
    windowDays: 90,
    referenceDate,
  });

  assert.equal(report.totalRunsAnalyzed, 1);
  assert.deepEqual(report.files, {});
});

test('sorts files and tests by failure count descending', async (t) => {
  const downloadsDirectory = await createTempDir({ t });
  const referenceDate = new Date('2026-08-20T00:00:00.000Z');
  const runs = [
    {
      databaseId: 1,
      createdAt: '2026-08-19T00:00:00.000Z',
      url: 'https://example.com/runs/1',
    },
    {
      databaseId: 2,
      createdAt: '2026-08-18T00:00:00.000Z',
      url: 'https://example.com/runs/2',
    },
  ];

  await writeRunArtifact({
    downloadsDirectory,
    runId: 1,
    flakyTests: [
      { testId: 'A', title: 'A', file: 'a.spec.ts' },
      { testId: 'B1', title: 'B1', file: 'b.spec.ts' },
      { testId: 'B2', title: 'B2', file: 'b.spec.ts' },
    ],
  });
  await writeRunArtifact({
    downloadsDirectory,
    runId: 2,
    flakyTests: [
      { testId: 'B1', title: 'B1', file: 'b.spec.ts' },
      { testId: 'B2', title: 'B2', file: 'b.spec.ts' },
    ],
  });

  const report = await aggregateFlakyTests({
    runs,
    downloadsDirectory,
    windowDays: 90,
    referenceDate,
  });

  assert.deepEqual(Object.keys(report.files), ['b.spec.ts', 'a.spec.ts']);
  assert.equal(report.files['b.spec.ts'].failures, 4);
  assert.deepEqual(
    report.files['b.spec.ts'].tests.map((test) => test.testId),
    ['B1', 'B2'],
  );
});
