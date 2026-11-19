import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

import { MACHINE_USERNAME_PATTERN } from '@121-service/src/user/const/machine-username.const';

export class CreateMachineUserDto {
  @ApiProperty({
    example: 'espo-connector',
    description:
      'Letters, numbers, dots, underscores and hyphens only. Converted to lowercase.',
  })
  @IsNotEmpty()
  @IsString()
  @Matches(MACHINE_USERNAME_PATTERN, {
    message:
      'username may only contain letters, numbers, dots, underscores and hyphens',
  })
  public readonly username: string;
}
