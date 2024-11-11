import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

// Import locale data for formatting dates, times, numbers, etc.
// Make sure to include any language-codes from the ENV-variable: NG_LOCALES
import '@angular/common/locales/global/ar';
import '@angular/common/locales/global/es';
import '@angular/common/locales/global/fr';
import '@angular/common/locales/global/nl';
import '@angular/common/locales/global/ru';

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch((err) => console.log(err));
