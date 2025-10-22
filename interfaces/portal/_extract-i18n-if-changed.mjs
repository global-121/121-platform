#!/usr/bin/env node
import { execSync } from 'node:child_process';

const I18N_TOKENS_REGEX = /\$localize\b|\bi18n\b/;

const hasI18nIndicators = (diff) => {
  if (diff.trim() === '') {
    return false;
  }
  return diff
    .split('\n')
    .filter(
      (line) =>
        // Check for added lines (start with '+') or removed lines (start with '-')
        (line.startsWith('+') && !line.startsWith('+++')) ||
        (line.startsWith('-') && !line.startsWith('---')),
    )
    .some((line) => I18N_TOKENS_REGEX.test(line));
};

const main = () => {
  const diff = execSync('git diff --staged', { encoding: 'utf8' });
  const shouldRun = hasI18nIndicators(diff);

  if (!shouldRun) {
    console.log(
      '[extract-i18n:smart] No changed lines with $localize or i18n detected. Skipping.',
    );
    return;
  }

  console.log(
    '[extract-i18n:smart] Detected i18n-related changes. Extracting...',
  );
  execSync('npm run extract-i18n', { stdio: 'inherit' });
  execSync('git add src/locale/messages.xlf', { stdio: 'inherit' });
};

main();
