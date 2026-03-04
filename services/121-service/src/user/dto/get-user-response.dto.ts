import { ApiProperty } from '@nestjs/swagger';

export class GetUserReponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  username: string;

  @ApiProperty({ example: false })
  admin: boolean;

  @ApiProperty({ example: true })
  active: boolean;

  @ApiProperty({ nullable: true })
  lastLogin: Date | null;

  @ApiProperty()
  scope: string;

  @ApiProperty()
  roles: {
    id: number;
    role: string;
    label: string;
  }[];
}
