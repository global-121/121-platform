// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  // Feature-switches:
  isDebug: true,
  showDebug: true,
  production: false, // Controls debugging features
  localStorage: false, // Use local or remote wallet/account
  useAnimation: false, // Use animations and delays in the interface

  // APIs:
  url_121_service_api: 'http://localhost:3000/api',
  url_pa_account_service_api: 'http://localhost:3001/api',
  url_user_ims_api: 'http://localhost:50003/api',

};
