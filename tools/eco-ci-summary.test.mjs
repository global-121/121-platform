import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import { summarize } from './eco-ci-summary.mjs';

describe('Native Eco CI workflow totals', () => {
  it('sums laps and native carbon categories once across six shards', async () => {
    // Arrange
    await withMeasurements({
      count: 6,
      run: async ({ directory, expectedProducers }) => {
        // Act
        const summary = await summarize({
          directory,
          expectedProducers,
          runId: '123',
          attempt: '1',
        });

        // Assert
        assert.equal(summary.totals.joules, 180);
        assert.ok(Math.abs(summary.totals.operational - 0.06) < 1e-12);
        assert.ok(Math.abs(summary.totals.embodied - 0.12) < 1e-12);
        assert.ok(Math.abs(summary.totals.combined - 0.18) < 1e-12);
        assert.equal(summary.measurements.length, 6);
      },
    });
  });

  it('includes all seven performance shards', async () => {
    // Arrange
    await withMeasurements({
      count: 7,
      run: async ({ directory, expectedProducers }) => {
        // Act
        const summary = await summarize({
          directory,
          expectedProducers,
          runId: '123',
          attempt: '1',
        });

        // Assert
        assert.equal(summary.totals.joules, 210);
        assert.equal(summary.measurements.length, 7);
      },
    });
  });

  it('retains the slim approximation label without changing native values', async () => {
    // Arrange
    await withMeasurements({
      count: 1,
      statusOverrides: { approximate: true },
      run: async ({ directory, expectedProducers }) => {
        // Act
        const summary = await summarize({
          directory,
          expectedProducers,
          runId: '123',
          attempt: '1',
        });

        // Assert
        assert.equal(summary.measurements[0].approximate, true);
        assert.equal(summary.totals.combined, 0.03);
      },
    });
  });

  for (const [scenario, overrides] of [
    ['failed workloads', { workload: 'failure' }],
    ['failed instrumentation', { complete: false }],
    ['previous attempts', { attempt: '0' }],
    ['different runs', { runId: '456' }],
  ]) {
    it(`rejects ${scenario} instead of presenting a complete total`, async () => {
      // Arrange
      await withMeasurements({
        count: 1,
        statusOverrides: overrides,
        run: async ({ directory, expectedProducers }) => {
          // Act & Assert
          await assert.rejects(
            summarize({
              directory,
              expectedProducers,
              runId: '123',
              attempt: '1',
            }),
          );
        },
      });
    });
  }

  it('rejects missing shards', async () => {
    // Arrange
    await withMeasurements({
      count: 1,
      run: async ({ directory, expectedProducers }) => {
        // Act & Assert
        await assert.rejects(
          summarize({
            directory,
            expectedProducers: [...expectedProducers, 'shard-2'],
            runId: '123',
            attempt: '1',
          }),
          /Missing measurements: shard-2/,
        );
      },
    });
  });

  it('rejects duplicate producer identities', async () => {
    // Arrange
    await withMeasurements({
      count: 2,
      statusOverrides: { producer: 'shard-1' },
      run: async ({ directory, expectedProducers }) => {
        // Act & Assert
        await assert.rejects(
          summarize({
            directory,
            expectedProducers,
            runId: '123',
            attempt: '1',
          }),
          /duplicate/,
        );
      },
    });
  });

  it('rejects missing native carbon output rather than inventing zero', async () => {
    // Arrange
    await withMeasurements({
      count: 1,
      output: 'Could not display table as no measurement data was present!',
      run: async ({ directory, expectedProducers }) => {
        // Act & Assert
        await assert.rejects(
          summarize({
            directory,
            expectedProducers,
            runId: '123',
            attempt: '1',
          }),
          /native Eco CI carbon output/,
        );
      },
    });
  });

  it('rejects malformed native lap values', async () => {
    // Arrange
    await withMeasurements({
      count: 1,
      energy: '',
      run: async ({ directory, expectedProducers }) => {
        // Act & Assert
        await assert.rejects(
          summarize({
            directory,
            expectedProducers,
            runId: '123',
            attempt: '1',
          }),
          /Invalid Eco CI number/,
        );
      },
    });
  });

  it('rejects repeated native carbon totals rather than double-counting them', async () => {
    // Arrange
    await withMeasurements({
      count: 1,
      output: ['CO₂ from energy is: 0.01 g', 'CO₂ from energy is: 0.02 g'].join(
        '\n',
      ),
      run: async ({ directory, expectedProducers }) => {
        // Act & Assert
        await assert.rejects(
          summarize({
            directory,
            expectedProducers,
            runId: '123',
            attempt: '1',
          }),
          /ambiguous native Eco CI carbon output/,
        );
      },
    });
  });

  it('reports skipped work without fabricating a zero total', async () => {
    // Arrange
    await withMeasurements({
      count: 0,
      run: async (fixture) => {
        // Act
        const { summary, markdown } = await runSummary({
          ...fixture,
          jobResults: { test: { result: 'skipped' } },
        });

        // Assert
        assert.deepEqual(summary, { complete: false, status: 'not-run' });
        assert.match(markdown, /Not run \/ no measurement/);
        assert.doesNotMatch(markdown, /\*\*Energy:/);
      },
    });
  });

  it('keeps build totals when only a later deployment fails', async () => {
    // Arrange
    await withMeasurements({
      count: 1,
      run: async (fixture) => {
        // Act
        const { summary, markdown } = await runSummary({
          ...fixture,
          jobResults: { 'build-and-deploy': { result: 'failure' } },
        });

        // Assert
        assert.equal(summary.complete, true);
        assert.equal(summary.totals.joules, 30);
        assert.match(markdown, /\*\*Energy: 30\.000000000 J\*\*/);
        assert.match(markdown, /\*\*CO2e \(Eco CI SCI\): 0\.030000 g\*\*/);
      },
    });
  });

  it('warns and publishes an incomplete status when a measured test fails', async () => {
    // Arrange
    await withMeasurements({
      count: 1,
      statusOverrides: { workload: 'failure' },
      run: async (fixture) => {
        // Act
        const { summary, markdown, stdout } = await runSummary({
          ...fixture,
          jobResults: { test: { result: 'failure' } },
        });

        // Assert
        assert.equal(summary.complete, false);
        assert.equal(summary.status, 'incomplete');
        assert.equal(summary.totals, undefined);
        assert.match(markdown, /Incomplete/);
        assert.match(stdout, /::warning::Eco CI total incomplete/);
      },
    });
  });
});

async function runSummary({
  directory,
  workspace,
  expectedProducers,
  jobResults,
}) {
  const { stdout } = await promisify(execFile)(
    process.execPath,
    [
      fileURLToPath(new URL('./eco-ci-summary.mjs', import.meta.url)),
      'summarize',
    ],
    {
      cwd: workspace,
      env: {
        ...process.env,
        ENERGY_DIRECTORY: directory,
        ENERGY_PRODUCERS: JSON.stringify(expectedProducers),
        ENERGY_NEEDS: JSON.stringify(jobResults),
        GITHUB_RUN_ID: '123',
        GITHUB_RUN_ATTEMPT: '1',
        GITHUB_STEP_SUMMARY: join(workspace, 'summary.md'),
      },
    },
  );
  return {
    summary: JSON.parse(
      await readFile(join(workspace, 'eco-ci-total/total.json'), 'utf8'),
    ),
    markdown: await readFile(join(workspace, 'summary.md'), 'utf8'),
    stdout,
  };
}

async function withMeasurements({
  count,
  run,
  statusOverrides = {},
  energy = '1e1',
  output = [
    'CO₂ from energy is: 0.010000000 g',
    'CO₂ from manufacturing (embodied carbon) is: 0.020000000 g',
    '<a href="https://sci-guide.greensoftware.foundation/">SCI</a>: <b>0.030000 gCO₂eq / pipeline run</b> emitted',
  ].join('\n'),
}) {
  const root = await mkdtemp(join(tmpdir(), 'eco-ci-summary-test-'));
  const directory = join(root, 'artifacts');
  const workspace = join(root, 'workspace');
  const expectedProducers = [];
  try {
    await mkdir(directory);
    await mkdir(workspace);
    for (let index = 1; index <= count; index++) {
      const producer = `shard-${index}`;
      expectedProducers.push(producer);
      const producerDirectory = join(directory, producer);
      await mkdir(producerDirectory);
      await writeFile(
        join(producerDirectory, 'measurement-status.json'),
        JSON.stringify({
          producer,
          runId: '123',
          attempt: '1',
          workload: 'success',
          complete: true,
          approximate: false,
          ...statusOverrides,
        }),
      );
      await writeFile(
        join(producerDirectory, 'lap-data.json'),
        JSON.stringify({
          steps: [{ energy_joules: energy }, { energy_joules: '20' }],
        }),
      );
      await writeFile(join(producerDirectory, 'output.txt'), output);
    }
    await run({ directory, workspace, expectedProducers });
  } finally {
    await rm(root, { recursive: true });
  }
}
