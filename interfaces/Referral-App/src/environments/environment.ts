// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,

  // Configuration/Feature-switches:
  useServiceWorker: false, // Enable 'offline' support

  // APIs:

  // Regions:
  regions: '',

  // Google Sheets:
  google_sheets_api_url: '',
  google_sheets_sheet_ids: '',

  // Third-party tokens:
  ai_ikey: '',
  ai_endpoint: '',

  matomo_id: '',
  matomo_endpoint_api: '',
  matomo_endpoint_js: '',
};
