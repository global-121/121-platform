// Merges the per-shard `failed-tests.json` files (downloaded from separate
// artifacts) into a single array for the whole workflow run.

import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const inputDir = process.argv[2] ?? 'downloaded-artifacts';
const outputPath = process.argv[3] ?? 'failed-tests.json';

const findFailedTestsFiles = async ({ directory }) => {
  const entries = await readdir(directory, {
    recursive: true,
    withFileTypes: true,
  });

  return entries
    .filter((entry) => entry.isFile() && entry.name === 'failed-tests.json')
    .map((entry) => path.join(entry.parentPath ?? entry.path, entry.name));
};

export const mergeFailedTests = async ({ inputDirectory, outputFilePath }) => {
  const files = await findFailedTestsFiles({ directory: inputDirectory });

  const merged = [];
  for (const file of files) {
    const contents = JSON.parse(await readFile(file, 'utf8'));
    if (!Array.isArray(contents)) {
      throw new Error(`Expected an array of failed tests in ${file}`);
    }
    merged.push(...contents);
  }

  await writeFile(outputFilePath, `${JSON.stringify(merged, null, 2)}\n`);
  return merged;
};

if (import.meta.url === `file://${process.argv[1]}`) {
  await mergeFailedTests({
    inputDirectory: inputDir,
    outputFilePath: outputPath,
  });
}
