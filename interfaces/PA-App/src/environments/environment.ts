// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,

  // Feature-switches:
  isDebug: true, // Controls debugging features
  showDebug: false, // Controls debugging features
  localStorage: false, // Use local or remote wallet/account
  useAnimation: false, // Use animations and delays in the interface
  alwaysShowTextPlayer: true, // Also show text-player for missing audio-files

  locales: 'en,saq_KE,tuv_KE,ar,ti,tl', // Comma-separated string of enabled locales, i.e: 'en,es,nl_BE'

  // APIs:
  url_121_service_api: 'http://localhost:3000/api',
  url_pa_account_service_api: 'http://localhost:3001/api',
  url_user_ims_api: 'http://localhost:50003/api',

  // Third-party tokens:
  ai_ikey: '',
  ai_endpoint: '',

  matomo_id: '',
  matomo_endpoint_api: '',
  matomo_endpoint_js: '',
};
