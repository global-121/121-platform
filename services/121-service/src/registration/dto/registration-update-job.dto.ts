import { ScopedUserInterface } from '../../shared/middleware/scope-user.middleware';

export class RegistrationsUpdateJobDto {
  referenceId: string;
  programId: number;
  data: Record<string, string>;
  request?: ScopedUserInterface;
}
