export interface CreateUserEmailPayload {
  email: string;
  displayName: string;
  password?: string;
}

export interface FailedPhoneNumberValidationEmailPayload {
  email: string;
  displayName: string;
  attachment?: { name: string; contentBytes: string };
}
