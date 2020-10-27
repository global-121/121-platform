const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
const fs = require('fs');
const exec = require('child_process').exec;

// Documentation: https://www.ffmpeg.org/ffmpeg.html
// Also: https://trac.ffmpeg.org/wiki/Encode/MP3
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;

/**
 * Perform check(s) on source paths/files before proceeding...
 * @param {String} locale
 */
function checkSourceExists(locale) {
  const sourcePath = `src/assets/i18n/${locale}/`;

  if (!locale || !fs.existsSync(sourcePath)) {
    console.warn(`No folder available for locale: ${locale}`);
    return process.exit();
  }

  // Change to requested folder:
  process.chdir(sourcePath);
}

/**
 * Convert audio assets from *.m4a to *.mp3
 * @param {String} locale
 */
function convertM4aToMp3(locale) {
  const sourceFileType = '.m4a';
  const outputFileType = '.mp3';

  checkSourceExists(locale);

  // Run `ffmpeg` command on all source-files:
  fs.readdirSync('./')
    .filter((file) => file.match(`${sourceFileType}$`))
    .forEach((file) => {
      const outputFile = file.replace(sourceFileType, outputFileType);

      console.log(`Converting to: ${outputFile}`);

      return exec(
        `${ffmpegPath} -i ${file} -c:a libmp3lame -q:a 8 ${outputFile}`,
      );
    });

  // Add extra timeout, to allow the last file-conversion to finish
  setTimeout(() => {
    process.exit();
  }, 1000);
}

/**
 * Generate audio assets in the required format(s)
 * @param {String} locale
 */
function generateAssetsAudio(locale) {
  const sourceFileType = '.mp3';
  const outputFileType = '.webm';

  checkSourceExists(locale);

  // Run `ffmpeg` command on all source-files:
  fs.readdirSync('./')
    .filter((file) => file.match(`${sourceFileType}$`))
    .forEach((file) => {
      const outputFile = file.replace(sourceFileType, outputFileType);

      console.log(`Generating: ${outputFile}`);

      return exec(`${ffmpegPath} -i ${file} -dash 1 ${outputFile}`);
    });

  // Add extra timeout, to allow the last file-conversion to finish
  setTimeout(() => {
    process.exit();
  }, 1000);
}

///////////////////////////////////////////////////////////////////////////////

// When the `--convert` flag is used, convert the source-files to mp3 first
if (process.argv[3] === '--convert') {
  return convertM4aToMp3(process.argv[2]);
}

// When a locale is provided via the command-line, use that:
if (process.argv[2]) {
  return generateAssetsAudio(process.argv[2]);
}
// Otherwise, ask for it:
rl.question(
  'For which locale do you want to generate audio assets? : ',
  (locale) => {
    return generateAssetsAudio(locale);
  },
);
