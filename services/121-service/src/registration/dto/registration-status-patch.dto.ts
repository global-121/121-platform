import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { RegistrationStatusEnum } from '../enum/registration-status.enum';

export class RegistrationStatusPatchDto {
  @ApiProperty({
    example: RegistrationStatusEnum.included,
  })
  @IsEnum(RegistrationStatusEnum)
  public readonly status: RegistrationStatusEnum;

  @ApiProperty({ example: 'Long enough rejection message' })
  @MinLength(20)
  @IsString()
  @IsOptional()
  public readonly message: string;
}
