import { ApiProperty } from '@nestjs/swagger';

import { AssignedAccessGroupDto } from '@121-service/src/user/dto/assigned-access-group.dto';

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

  @ApiProperty({ example: true })
  isEligiblePaymentApprover: boolean;

  @ApiProperty()
  roles: {
    id: number;
    role: string;
    label: string;
  }[];

  @ApiProperty({
    type: [AssignedAccessGroupDto],
    description:
      'The access groups the user is restricted to, from the highest level down. Empty when the user is not restricted by access groups.',
  })
  accessGroups: AssignedAccessGroupDto[];
}
