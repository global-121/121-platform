// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,

  // Configuration/Feature-switches:
  isDebug: true, // Controls debugging features
  showDebug: false, // Controls debugging features
  useAnimation: true, // Use animations and delays in the interface
  disableTextPlayer: false, // Hide player and don't attempt to find audio-files
  alwaysShowTextPlayer: true, // Also show text-player for missing audio-files
  useServiceWorker: true, // Enable 'offline' support
  envName: '', // To highlight the environment used
  locales: 'en,ar,fr,nl,pt_BR,tl,in,es', // Comma-separated string of enabled locales, i.e: 'en,es,nl_BE'

  // APIs:
  url_121_service_api: 'http://localhost:3000/api',

  // Third-party tokens:
  ai_ikey: '',
  ai_endpoint: '',

  matomo_id: '',
  matomo_endpoint_api: '',
  matomo_endpoint_js: '',
};
