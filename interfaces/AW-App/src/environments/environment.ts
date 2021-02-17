// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,

  // Feature-switches:
  isDebug: true, // Controls debugging features
  showDebug: false, // Controls debugging features
  useAnimation: false, // Use animations and delays in the interface
  useServiceWorker: false,
  envName: '', // To highlight the environment used

  // APIs:
  url_121_service_api: 'http://localhost:3000/api',

  // Third-party tokens:
  ai_ikey: '',
  ai_endpoint: '',
};
