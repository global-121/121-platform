import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, Length } from 'class-validator';
import { RegistrationStatusEnum } from '../enum/registration-status.enum';

export class UpdateRegistrationDto {
  @ApiProperty({ example: '910c50be-f131-4b53-b06b-6506a40a2734' })
  @Length(29, 36)
  @IsString()
  public readonly referenceId: string;

  @ApiProperty({
    enum: RegistrationStatusEnum,
    example: RegistrationStatusEnum.registered,
  })
  @IsNotEmpty()
  @IsString()
  @IsEnum(RegistrationStatusEnum)
  public readonly registrationStatus: RegistrationStatusEnum;
}
