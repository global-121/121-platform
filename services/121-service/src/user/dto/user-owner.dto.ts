import { ApiProperty } from '@nestjs/swagger';

export class UserOwnerDto {
  @ApiProperty({ example: 1, type: 'number' })
  id: number;
  @ApiProperty({ example: 'adress@example.org', type: 'string' })
  username: string;
}
