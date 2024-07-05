/// <reference types="@angular/localize" />

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from '~/app.config';
import { registerChartDefaults } from '~/utils/chart';
import { initLanguage } from '~/utils/locale';

registerChartDefaults();

// Init provided language
initLanguage()
  // Only load text after locale is initialized to translate static file
  .then(() => import('~/app.component'))
  .then((comp) => bootstrapApplication(comp.AppComponent, appConfig))
  .catch((err: unknown) => {
    console.error(err);
  });
