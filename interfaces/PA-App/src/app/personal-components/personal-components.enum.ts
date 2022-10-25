export enum PersonalComponents {
  consentQuestion = 'consent-question',
  contactDetails = 'contact-details',
  createAccount = 'create-account',
  enrollInProgram = 'enroll-in-program',
  loginAccount = 'login-account',
  monitoringQuestion = 'monitoring-question',
  registrationSummary = 'registration-summary',
  selectFsp = 'select-fsp',
  selectLanguage = 'select-language',
  selectProgram = 'select-program',
  setNotificationNumber = 'set-notification-number',
  signupSignin = 'signup-signin',
  autoSignup = 'auto-signup',
  nextPa = 'next-pa',
}

// These sections are no longer available in the PA-app, but PA might have data for these in their ConversationHistory
export const PersonalComponentsRemoved = [
  'select-appointment',
  'select-country',
  'store-credential',
  'handle-proof',
  'create-identity',
  'login-identity',
  'preprinted-qrcode',
];
