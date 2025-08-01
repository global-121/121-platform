import { IsOptional, IsString } from 'class-validator';

export class ExportDetailsQueryParamsDto {
  @IsString() // Validate that 'search' is a string
  @IsOptional()
  public readonly search?: string; // Add 'search' parameter
}
