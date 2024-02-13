import { ApiProperty } from '@nestjs/swagger';
import { UserOwnerDto } from '../../../../user/dto/user-owner.dto';

export class RegistrationChangeLogReturnDto {
  @ApiProperty({ example: 1, type: 'number' })
  id: number;
  @ApiProperty({ example: 1, type: 'number' })
  registrationId: number;
  @ApiProperty({ type: () => UserOwnerDto })
  user: UserOwnerDto;
  @ApiProperty({ example: '2021-09-01T00:00:00.000Z' })
  created: Date;
  @ApiProperty({ example: 'phoneNumber', type: 'string' })
  fieldName: string;
  @ApiProperty({ example: '31000000000', type: 'string' })
  oldValue: string;
  @ApiProperty({ example: '31000000001', type: 'string' })
  newValue: string;
  @ApiProperty({ example: 'Changed phone number', type: 'string' })
  reason: string;
}
