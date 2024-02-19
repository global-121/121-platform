// This file is required by karma.conf.js and loads recursively all the .spec and framework files
// tslint:disable:ordered-imports
import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import { setAssetPath } from '@stencil/core';

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
  {
    teardown: { destroyAfterEach: false },
  },
);

// Fix warnings about loading of Ionicons (and other assets)
// See: https://github.com/ionic-team/ionicons/issues/1302
setAssetPath(`${window.location.origin}/`);
