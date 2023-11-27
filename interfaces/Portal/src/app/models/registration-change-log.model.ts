export class RegistrationChangeLog {
  id: number;
  created: string;
  updated: string;
  registrationId: number;
  user: {
    admin: boolean;
    created: string;
    id: number;
    updated: string;
    userType: string;
    username: string;
  };
  userId: number;
  fieldName: string;
  oldValue: string;
  newValue: string;
  reason: string;
}
