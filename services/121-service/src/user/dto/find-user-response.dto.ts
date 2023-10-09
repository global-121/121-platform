import { ApiProperty } from '@nestjs/swagger';

export class FindUserReponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'test@example.org' })
  username: string;
}
