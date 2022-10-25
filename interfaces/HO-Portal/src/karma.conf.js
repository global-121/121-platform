// Karma configuration file, see link for more information
// https://karma-runner.github.io/6.3/config/configuration-file.html

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('@angular-devkit/build-angular/plugins/karma'),
    ],
    client: {
      clearContext: false, // leave Jasmine Spec Runner output visible in browser
    },
    reporters: ['progress', 'kjhtml', 'coverage'],
    coverageReporter: {
      dir: require('path').join(__dirname, '../coverage'),
      subdir: '.',
      reporters: [
        {
          type: 'html',
        },
        { type: 'lcovonly' },
        { type: 'text-summary' },
      ],
      combineBrowserReports: true,
    },
    port: 9876,
    colors: true,
    captureConsole: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    restartOnFileChange: true,
    browsers: ['Chrome'],
    singleRun: false,
    stopOnSpecFailure: true,
    stopSpecOnExpectationFailure: true,
    failSpecWithNoExpectations: true,
  });
};
