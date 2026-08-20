import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { extractFailedTests } from './extract-failed-tests.mjs';

const sampleReport = {
  suites: [
    {
      title: 'portal.spec.ts',
      suites: [
        {
          title: 'Login',
          specs: [
            {
              title: 'logs in successfully',
              file: 'portal/tests/login.spec.ts',
              tests: [
                {
                  projectName: 'chromium',
                  status: 'flaky',
                  results: [
                    { duration: 1200, errors: [{ message: 'Timed out' }] },
                    { duration: 900, errors: [] },
                  ],
                },
              ],
            },
            {
              title: 'shows validation error',
              file: 'portal/tests/login.spec.ts',
              tests: [
                {
                  projectName: 'chromium',
                  status: 'expected',
                  results: [{ duration: 500, errors: [] }],
                },
              ],
            },
          ],
        },
      ],
      specs: [],
    },
  ],
};

const createTempDir = async ({ t }) => {
  const directory = await mkdtemp(path.join(tmpdir(), 'extract-tests-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return directory;
};

test('extracts only flaky tests with normalized fields', async (t) => {
  const directory = await createTempDir({ t });
  const inputFilePath = path.join(directory, 'results.json');
  const outputFilePath = path.join(directory, 'failed-tests.json');
  await writeFile(inputFilePath, JSON.stringify(sampleReport));

  const flakyTests = await extractFailedTests({
    inputFilePath,
    outputFilePath,
  });

  assert.equal(flakyTests.length, 1);
  assert.equal(flakyTests[0].title, 'logs in successfully');
  assert.equal(flakyTests[0].testId, 'Login > logs in successfully');
  assert.equal(flakyTests[0].retries, 1);
  assert.deepEqual(flakyTests[0].errors, ['Timed out']);

  const written = JSON.parse(await readFile(outputFilePath, 'utf8'));
  assert.deepEqual(written, flakyTests);
});

test('writes an empty array when the report file is missing', async (t) => {
  const directory = await createTempDir({ t });
  const outputFilePath = path.join(directory, 'failed-tests.json');

  const flakyTests = await extractFailedTests({
    inputFilePath: path.join(directory, 'does-not-exist.json'),
    outputFilePath,
  });

  assert.deepEqual(flakyTests, []);
  assert.equal((await readFile(outputFilePath, 'utf8')).trim(), '[]');
});
