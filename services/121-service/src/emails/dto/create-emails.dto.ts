export interface CreateUserEmailPayload {
  email: string;
  username: string;
  password?: string;
}

export interface GenericEmailPayload {
  email: string;
  subject: string;
  body: string;
}
