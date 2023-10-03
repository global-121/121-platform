import { ApiProperty } from '@nestjs/swagger';
import { IsNotIn, IsString, Length } from 'class-validator';

export class CreateRegistrationDto {
  @ApiProperty({ example: '910c50be-f131-4b53-b06b-6506a40a2734' })
  @Length(5, 200)
  @IsString()
  @IsNotIn(['status']) //To avoid endpoint confusion in registration.controller
  public referenceId: string;
}
