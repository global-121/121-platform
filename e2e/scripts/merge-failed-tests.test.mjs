import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { mergeFailedTests } from './merge-failed-tests.mjs';

const createTempDir = async ({ tempDir }) => {
  const directory = await mkdtemp(path.join(tmpdir(), 'merge-tests-'));
  tempDir.after(() => rm(directory, { recursive: true, force: true }));
  return directory;
};

test('merges failed-tests.json files found in nested shard directories', async (t) => {
  const directory = await createTempDir({ tempDir: t });
  const shardOneDir = path.join(directory, 'failed-tests-json-1');
  const shardTwoDir = path.join(directory, 'failed-tests-json-2');

  await mkdir(shardOneDir, { recursive: true });
  await mkdir(shardTwoDir, { recursive: true });

  await writeFile(
    path.join(shardOneDir, 'failed-tests.json'),
    JSON.stringify([{ testId: 'A' }]),
  );

  await writeFile(
    path.join(shardTwoDir, 'failed-tests.json'),
    JSON.stringify([{ testId: 'B' }, { testId: 'C' }]),
  );

  const outputFilePath = path.join(directory, 'merged.json');
  const merged = await mergeFailedTests({
    inputDirectory: directory,
    outputFilePath,
  });

  assert.equal(merged.length, 3);
  assert.deepEqual(merged.map((test) => test.testId).sort(), ['A', 'B', 'C']);

  const written = JSON.parse(await readFile(outputFilePath, 'utf8'));
  assert.deepEqual(written, merged);
});

test('returns an empty array when no failed-tests.json files exist', async (t) => {
  const directory = await createTempDir({ tempDir: t });
  const outputFilePath = path.join(directory, 'merged.json');
  const merged = await mergeFailedTests({
    inputDirectory: directory,
    outputFilePath,
  });

  assert.deepEqual(merged, []);
});
