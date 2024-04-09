export class RegistrationsUpdateJobDto {
  referenceId: string;
  programId: number;
  data: Record<string, string>;
  request?: { userId: number; scope: string };
}
