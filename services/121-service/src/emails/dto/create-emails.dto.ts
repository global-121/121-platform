export interface CreateUserEmailPayload {
  email: string;
  username: string;
  password?: string;
  newUserMail: boolean;
}

export interface GenericEmailPayload {
  email: string;
  subject: string;
  body: string;
}
