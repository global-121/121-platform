import { ApiProperty } from '@nestjs/swagger';

export class ProgramPaymentsStatusDto {
  @ApiProperty({ example: 'true' })
  inProgress: boolean;
}
