const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
const fs = require('fs');
const exec = require('child_process').exec;
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;

/**
 * Generate audio assets in the required formats (*.mp3 and *.webm)
 * @param locale
 */
function generateAssetsAudio(locale) {
  const sourcePath = `src/assets/i18n/${locale}/`;
  const sourceFileType = '.mp3';

  if (!locale || !fs.existsSync(sourcePath)) {
    console.warn(`No folder available for locale: ${locale}`)
    return process.exit();
  }

  // Change to requested folder:
  process.chdir(sourcePath);

  // Run `ffmpeg` command on all source-files:
  fs.readdirSync('./')
    .filter((file) => file.match(`${sourceFileType}$`))
    .forEach((file) => {
      const outputFile = file.replace(`${sourceFileType}`, '.webm');

      return exec(
        `${ffmpegPath} -n -i ${file} -dash 1 ${outputFile}`,
        (error, stdout, stderr) => {
          if (error) {
            console.error(stderr);
          } else {
            console.log(stdout);
          }
        }
      );
    });
  process.exit();
}


///////////////////////////////////////////////////////////////////////////////


// When a locale is provided via the command-line, use that:
if (process.argv[2]) {
  return generateAssetsAudio(process.argv[2]);;
}
// Otherwise, ask for it:
rl.question('For which locale do you want to generate audio assets? : ', (locale) => {
  return generateAssetsAudio(locale);
});
