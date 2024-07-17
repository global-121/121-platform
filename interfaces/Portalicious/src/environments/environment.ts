// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,

  // Configuration/Feature-switches:
  defaultLocale: 'en',
  envName: '', // To highlight the environment used
  locales: 'en,nl', // Comma-separated string of enabled locales. Each should be available in: `./src/locale`

  // APIs
  url_121_service_api: 'http://localhost:3000/api',

  // Monitoring/Telemetry:
  applicationinsights_connection_string: '',

  // Azure AD
  use_sso_azure_entra: false, // Enable Azure AD login
  azure_ad_client_id: '',
  azure_ad_tenant_id: '',
};
