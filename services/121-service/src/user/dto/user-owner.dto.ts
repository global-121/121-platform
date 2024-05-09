import { ApiProperty } from '@nestjs/swagger';

export class UserOwnerDto {
  @ApiProperty({ example: 1, type: 'number' })
  id: number;
  @ApiProperty({ example: 'address@example.org', type: ['string', null] })
  username: string | null;
}
