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

export class GetAllUsersResponseDto {
  @ApiProperty()
  public readonly id: number;

  @ApiProperty({ nullable: true })
  public readonly username: string | null;

  @ApiProperty({ example: false })
  public readonly admin: boolean;

  @ApiProperty({ example: true })
  public readonly active: boolean;

  @ApiProperty({ nullable: true })
  public readonly lastLogin: Date | null;

  @ApiProperty()
  public readonly displayName: string;

  @ApiProperty({ example: false })
  public readonly isOrganizationAdmin: boolean;
}
