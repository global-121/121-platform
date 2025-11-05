// Karma configuration file, see link for more information
// https://karma-runner.github.io/latest/config/configuration-file.html

module.exports = function (config) {
  config.set({
    basePath: '',
    browsers: ['Chrome'],
    client: {
      jasmine: {
        // you can add configuration options for Jasmine here
        // the possible options are listed at https://jasmine.github.io/api/latest/Configuration.html
        // for example, you can disable the random execution with `random: false`
        // or set a specific seed with `seed: 4321`
      },
    },
    coverageReporter: {
      // eslint-disable-next-line no-undef -- false negative
      dir: require('path').join(__dirname, './coverage'),
      includeAllSources: true,
      reporters: [{ type: 'lcov' }, { type: 'text-summary' }],
      subdir: '.',
    },
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    jasmineHtmlReporter: {
      suppressAll: true, // removes the duplicated traces
    },
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
    ],
    reporters: ['progress', 'kjhtml'],
    restartOnFileChange: true,
  });
};
