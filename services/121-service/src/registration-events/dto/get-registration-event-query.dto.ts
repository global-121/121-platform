import { IsISO8601, IsOptional, IsString } from 'class-validator';

export class GetRegistrationEventsQueryDto {
  @IsOptional()
  @IsISO8601()
  public fromDate?: string;

  @IsOptional()
  @IsISO8601()
  public toDate?: string;

  @IsOptional()
  @IsString()
  public referenceId?: string;

  @IsOptional()
  public format?: string;
}
