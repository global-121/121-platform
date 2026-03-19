import { ApiProperty } from '@nestjs/swagger';

export class KoboImportSubmissionsResultDto {
  @ApiProperty({
    example: 5,
    description: 'Number of registrations successfully imported',
  })
  public readonly countImported: number;
}
