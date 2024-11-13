import { ApiProperty } from '@nestjs/swagger';

export class UserOwnerDto {
  @ApiProperty({ example: 1, type: 'number' })
  id: number;
  @ApiProperty({
    example: 'address@example.org',
    oneOf: [{ type: 'string' }, { type: 'null' }],
  })
  username: string | null;
}
