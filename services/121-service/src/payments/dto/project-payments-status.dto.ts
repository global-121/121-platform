import { ApiProperty } from '@nestjs/swagger';

export class ProjectPaymentsStatusDto {
  @ApiProperty({ example: 'true' })
  inProgress: boolean;
}
