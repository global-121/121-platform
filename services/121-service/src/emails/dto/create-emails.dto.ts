export interface CreateUserEmailPayload {
  email: string;
  displayName: string;
  password?: string;
}

export interface FailedValidationEmailPayload {
  email: string;
  displayName: string;
  attachment?: { name: string; contentBytes: string };
}
