export class RegistrationsUpdateJobDto {
  programId: number;
  data: Record<string, string | number | undefined | boolean>[];
  request: { userId: number; scope?: string };
  reason: string;
}
