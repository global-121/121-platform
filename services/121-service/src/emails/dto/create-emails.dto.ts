export interface CreateUserEmailPayload {
  email: string;
  displayName: string;
  password?: string;
}

export interface GenericEmailPayload {
  email: string;
  subject: string;
  body: string;
}
