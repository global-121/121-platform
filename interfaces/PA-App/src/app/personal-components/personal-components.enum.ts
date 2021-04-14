export enum PersonalComponents {
  consentQuestion = 'consent-question',
  contactDetails = 'contact-details',
  createIdentity = 'create-identity',
  enrollInProgram = 'enroll-in-program',
  handleProof = 'handle-proof',
  loginIdentity = 'login-identity',
  monitoringQuestion = 'monitoring-question',
  preprintedQrcode = 'preprinted-qrcode',
  registrationSummary = 'registration-summary',
  selectFsp = 'select-fsp',
  selectLanguage = 'select-language',
  selectProgram = 'select-program',
  setNotificationNumber = 'set-notification-number',
  signupSignin = 'signup-signin',
}

// These sections are no longer available in the PA-app, but PA might have data for these in their ConversationHistory
export const PersonalComponentsRemoved = [
  'select-appointment',
  'select-country',
  'store-credential',
];
