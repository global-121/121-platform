export enum LoginOtpAuditEventName {
  requested = 'LoginOtpRequested',
  succeeded = 'LoginOtpSucceeded',
  failed = 'LoginOtpFailed',
  locked = 'LoginOtpLocked',
}

export enum LoginOtpRequestOutcome {
  issued = 'issued',
  refused = 'refused',
  unknownUser = 'unknownUser',
  entraUser = 'entraUser',
}

export enum LoginOtpUserFailureReason {
  unknownUser = 'unknownUser',
  entraUser = 'entraUser',
}
