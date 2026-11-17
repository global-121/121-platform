import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

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

  @ApiProperty({
    example: 'Espo connector',
    required: false,
    description: 'Optional. If not supplied, the username is used.',
  })
  @IsOptional()
  @IsString()
  public readonly displayName?: string;
}
