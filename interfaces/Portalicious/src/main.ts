import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { registerChartDefaults } from './app/utils/chart';

registerChartDefaults();

bootstrapApplication(AppComponent, appConfig).catch((err: unknown) => {
  console.error(err);
});
