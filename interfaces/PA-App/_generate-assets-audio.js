const dotenv = require('dotenv');
const ffbinaries = require('ffbinaries');
const fs = require('fs');
const pathLib = require('path');
const { execSync } = require('child_process');

const LOCALES_SRC_PATH = 'src/assets/i18n';

// Load environment-variables from .env file (if available)
dotenv.config();

// Documentation: https://www.ffmpeg.org/ffmpeg.html
// Also: https://trac.ffmpeg.org/wiki/Encode/MP3
// Also: https://trac.ffmpeg.org/wiki/Encode/VP9
const ffmpegPath = getFfmpegPath();

/**
 * @returns {String} Path to `ffmpeg`
 */
function getFfmpegPath() {
  const result = ffbinaries.locateBinariesSync(['ffmpeg'], {
    paths: ['./node_modules/ffbinaries'], // See path set in npm-script: `postinstall`
    ensureExecutable: true,
  });
  if (!result || !result.ffmpeg || !result.ffmpeg.found) {
    console.warn(`ffmpeg not found.`);
    return process.exit(1);
  }
  return pathLib.resolve(result.ffmpeg.path);
}

/**
 * Log the output of the `exec`-command
 * @param {String} error
 * @param {String} stdOut
 * @param {String} stdErr
 */
function logOutput(error, stdOut, stdErr) {
  if (error) {
    console.error(stdErr);
    return process.exit(1);
  }
  console.log(stdOut);
  console.log(stdErr);
}

/**
 * @param {String} path
 * @param {String} type
 * @returns {Array}
 */
function getSourceFiles(path, type) {
  const files = fs.readdirSync(path).filter((file) => file.match(`${type}$`));

  if (!files || !files.length) {
    console.warn(`\n! No files found of type: ${type} in: ${path}`);
    return [];
  }

  return files;
}

/**
 * Perform check(s) on source paths/files before proceeding...
 * @param {String} locale
 * @returns {String | boolean} Path to existing source-files
 */
function checkSourceExists(locale) {
  const path = `${LOCALES_SRC_PATH}/${locale}/`;

  if (!locale || !fs.existsSync(path)) {
    console.warn(`\n! No folder available for locale: ${locale} in: ${path}`);
    return false;
  }

  return path;
}

/**
 * Convert audio assets from `sourceType` to *.mp3
 * @param {String} locale
 * @param {String} sourceType
 */
function convertToMp3(locale, sourceType) {
  const sourceFileType = `.${sourceType}`;
  const outputFileType = '.mp3';

  const path = checkSourceExists(locale);
  const sourceFiles = getSourceFiles(path, sourceFileType);

  if (!sourceFiles || !path) {
    return;
  }

  sourceFiles.forEach((file) => {
    const outputFile = file.replace(sourceFileType, outputFileType);

    console.log(`Converting to: ${path}${outputFile}`);

    execSync(
      `"${ffmpegPath}" -loglevel warning -y -i ${path}${file} -map_metadata -1 -codec:a libmp3lame -q:a 8 ${path}${outputFile}`,
      logOutput,
    );
  });

  // Add extra timeout, to allow the last file-conversion to finish
  setTimeout(() => {
    process.exit();
  }, 3000);
}

/**
 * Generate audio assets in the required format(s)
 * @param {String} locale
 */
function generateAssetsAudio(locale) {
  const sourceFileType = '.mp3';
  const outputFileType = '.webm';

  const path = checkSourceExists(locale);
  const sourceFiles = getSourceFiles(path, sourceFileType);

  if (!sourceFiles) {
    return;
  }

  sourceFiles.forEach((file) => {
    const outputFile = file.replace(sourceFileType, outputFileType);

    console.log(`Generating: ${path}${outputFile}`);

    execSync(
      `"${ffmpegPath}" -loglevel warning -y -i ${path}${file} -map_metadata -1  -b:a 64K  -dash 1 ${path}${outputFile}`,
      logOutput,
    );
  });

  // Add extra timeout, to allow the last file-conversion to finish
  setTimeout(() => {
    process.exit();
  }, 3000);
}

function getEnabledLocales(env) {
  if (!env) return [];

  return env.trim().split(/\s*,\s*/);
}

function getAllAvailableLocales() {
  const folders = fs
    .readdirSync(LOCALES_SRC_PATH, { withFileTypes: true })
    .filter((entry) => entry.isDirectory());
  return folders.map((folder) => folder.name);
}

///////////////////////////////////////////////////////////////////////////////

if (!!process.env.SKIP_GENERATE_AUDIO_FILES) {
  console.info('Skipping generation of audio-files in Test-environment.');
  return process.exit();
}

// When the `--convertFrom` flag is used, convert the source-files to mp3 first
if (process.argv[3] === '--convertFrom') {
  return convertToMp3(process.argv[2], process.argv[4]);
}

// When a locale is provided via the command-line, use that:
if (process.argv[2]) {
  return generateAssetsAudio(process.argv[2]);
}

let audioLocales;

// If locales are defined via ENV-variables, use that:
if (typeof process.env.NG_LOCALES !== 'undefined') {
  console.log(`Using locales from ENV: ${process.env.NG_LOCALES}`);

  audioLocales = getEnabledLocales(process.env.NG_LOCALES);
} else {
  audioLocales = getAllAvailableLocales();
}

// Otherwise, generate all:
return audioLocales.forEach((locale) => {
  return generateAssetsAudio(locale);
});
