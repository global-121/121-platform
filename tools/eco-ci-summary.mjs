import {
  appendFile,
  mkdir,
  readdir,
  readFile,
  writeFile,
} from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export async function summarize({
  directory,
  expectedProducers,
  runId,
  attempt,
}) {
  if (
    !Array.isArray(expectedProducers) ||
    expectedProducers.length === 0 ||
    expectedProducers.some(
      (producer) => typeof producer !== 'string' || !producer,
    ) ||
    new Set(expectedProducers).size !== expectedProducers.length
  ) {
    throw new Error(
      'Expected producers must be a nonempty array of unique identifiers',
    );
  }
  const entries = await readdir(directory, { withFileTypes: true });
  const measurements = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }
    const producerDirectory = resolve(directory, entry.name);
    const status = JSON.parse(
      await readFile(
        resolve(producerDirectory, 'measurement-status.json'),
        'utf8',
      ),
    );
    if (
      status.runId !== runId ||
      status.attempt !== attempt ||
      !expectedProducers.includes(status.producer) ||
      measurements.some(
        (measurement) => measurement.producer === status.producer,
      )
    ) {
      throw new Error(`Unexpected, duplicate or stale producer: ${entry.name}`);
    }
    if (status.complete !== true || status.workload !== 'success') {
      throw new Error(
        `Incomplete measurement or failed workload: ${status.producer}`,
      );
    }
    const laps = JSON.parse(
      await readFile(resolve(producerDirectory, 'lap-data.json'), 'utf8'),
    );
    if (!Array.isArray(laps.steps) || laps.steps.length === 0) {
      throw new Error(`No measured laps: ${status.producer}`);
    }
    const joules = laps.steps.reduce(
      (total, step) => total + readNumber({ value: step.energy_joules }),
      0,
    );
    const output = await readFile(
      resolve(producerDirectory, 'output.txt'),
      'utf8',
    );
    const operational = readCarbon({
      output,
      pattern: /CO₂ from energy is:\s*([^\s<]+)\s+g\b/g,
    });
    const embodied = readCarbon({
      output,
      pattern:
        /CO₂ from manufacturing \(embodied carbon\) is:\s*([^\s<]+)\s+g\b/g,
    });
    const combined = readCarbon({
      output,
      pattern: /SCI<\/a>:\s*<b>([^\s<]+)\s+gCO₂eq \/ pipeline run<\/b>/g,
    });
    measurements.push({
      producer: status.producer,
      approximate: status.approximate,
      joules,
      operational,
      embodied,
      combined,
    });
  }
  const missing = expectedProducers.filter(
    (producer) =>
      !measurements.some((measurement) => measurement.producer === producer),
  );
  if (missing.length > 0) {
    throw new Error(`Missing measurements: ${missing.join(', ')}`);
  }
  return {
    runId,
    attempt,
    complete: true,
    measurements,
    totals: measurements.reduce(
      (totals, measurement) => ({
        joules: totals.joules + measurement.joules,
        operational: totals.operational + measurement.operational,
        embodied: totals.embodied + measurement.embodied,
        combined: totals.combined + measurement.combined,
      }),
      { joules: 0, operational: 0, embodied: 0, combined: 0 },
    ),
  };
}

function readNumber({ value }) {
  if (
    (typeof value !== 'string' && typeof value !== 'number') ||
    !/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(String(value)) ||
    !Number.isFinite(Number(value)) ||
    Number(value) < 0
  ) {
    throw new Error(`Invalid Eco CI number: ${JSON.stringify(value)}`);
  }
  return Number(value);
}

function readCarbon({ output, pattern }) {
  const matches = [...output.matchAll(pattern)];
  if (matches.length !== 1) {
    throw new Error('Missing or ambiguous native Eco CI carbon output');
  }
  return readNumber({ value: matches[0][1] });
}

async function record() {
  await mkdir('/tmp/eco-ci', { recursive: true });
  const complete = [
    process.env.ENERGY_START,
    process.env.ENERGY_SAMPLE,
    process.env.ENERGY_DISPLAY,
  ].every((outcome) => outcome === 'success');
  const status = {
    producer: process.env.ENERGY_PRODUCER,
    runId: process.env.GITHUB_RUN_ID,
    attempt: process.env.GITHUB_RUN_ATTEMPT,
    workload: process.env.ENERGY_WORKLOAD,
    approximate: process.env.ENERGY_APPROXIMATE === 'true',
    complete,
  };
  await writeFile(
    '/tmp/eco-ci/measurement-status.json',
    JSON.stringify(status),
  );
  if (status.approximate) {
    await appendFile(
      process.env.GITHUB_STEP_SUMMARY,
      '\nEco CI approximation: ubuntu-slim uses the standard GitHub VM model. Actual consumption may differ; this is not a guaranteed upper bound.\n',
    );
  }
  if (!complete) {
    console.log('::warning::Eco CI did not produce a complete measurement.');
  }
}

async function main() {
  if (process.argv[2] === 'record') {
    await record();
    return;
  }
  if (process.argv[2] !== 'summarize') {
    throw new Error('Usage: node tools/eco-ci-summary.mjs record|summarize');
  }
  let summary;
  let markdown;
  try {
    const needs = JSON.parse(process.env.ENERGY_NEEDS);
    const results = Object.values(needs).map((job) => job.result);
    if (results.length === 0) {
      throw new Error('No measured jobs were specified.');
    }
    if (results.every((result) => result === 'skipped')) {
      summary = { complete: false, status: 'not-run' };
      markdown = '## Build/test Eco CI total\n\nNot run / no measurement.\n';
    } else {
      summary = await summarize({
        directory: process.env.ENERGY_DIRECTORY,
        expectedProducers: JSON.parse(process.env.ENERGY_PRODUCERS),
        runId: process.env.GITHUB_RUN_ID,
        attempt: process.env.GITHUB_RUN_ATTEMPT,
      });
      summary.jobResults = needs;
      markdown = [
        '## Build/test Eco CI total',
        '',
        `**Energy: ${summary.totals.joules.toFixed(9)} J**`,
        `**CO2e (Eco CI SCI): ${summary.totals.combined.toFixed(6)} g**`,
        '',
        `Operational: ${summary.totals.operational.toFixed(9)} g; embodied: ${summary.totals.embodied.toFixed(9)} g.`,
        '',
        '| Job/shard | Energy (J) | Eco CI SCI (gCO2e) |',
        '| --- | ---: | ---: |',
        ...summary.measurements.map(
          (measurement) =>
            `| ${measurement.producer}${measurement.approximate ? ' (slim approximation)' : ''} | ${measurement.joules.toFixed(9)} | ${measurement.combined.toFixed(6)} |`,
        ),
        '',
        'Totals sum native Eco CI results, including their rounding. Only build/test work and required setup are included.',
        '',
      ].join('\n');
    }
  } catch (error) {
    console.log(`::warning::Eco CI total incomplete: ${error.message}`);
    summary = { complete: false, status: 'incomplete', reason: error.message };
    markdown = `## Build/test Eco CI total\n\n**Incomplete: no complete workflow total available.**\n\n${error.message}\n`;
  }
  await mkdir('eco-ci-total', { recursive: true });
  await writeFile('eco-ci-total/total.json', JSON.stringify(summary, null, 2));
  await appendFile(process.env.GITHUB_STEP_SUMMARY, markdown);
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
