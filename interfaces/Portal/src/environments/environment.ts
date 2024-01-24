// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,

  // Configuration/Feature-switches:
  useServiceWorker: false, // Enable 'offline' support
  defaultLocale: 'en',
  envName: '', // To highlight the environment used
  locales: 'en,ar,fr,nl,es', // Comma-separated string of enabled locales (i.e: 'en,es,nl_BE'). Each should be available in: `./src/app/services/language.service.ts`

  // APIs
  url_121_service_api: 'http://localhost:3000/api',

  // Third-party tokens:
  ai_ikey: '',
  ai_endpoint: '',

  twilio_error_codes_url: 'https://www.twilio.com/docs/api/errors',
};
