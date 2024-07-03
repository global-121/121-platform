import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from '~/app.component';
import { appConfig } from '~/app.config';
import { registerChartDefaults } from '~/utils/chart';

registerChartDefaults();

bootstrapApplication(AppComponent, appConfig).catch((err: unknown) => {
  console.error(err);
});
