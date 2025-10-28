export interface EmailData {
  email: string;
  subject: string;
  body: string;
  attachment?: {
    name: string;
    contentBytes: string;
  };
}
