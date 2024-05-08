import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { RegistrationStatusEnum } from '../enum/registration-status.enum';
import { IsNotBothPresent } from '../validators/is-not-both-present.class.validator';

export class RegistrationStatusPatchDto {
  @ApiProperty({
    example: RegistrationStatusEnum.included,
  })
  @IsEnum(RegistrationStatusEnum)
  public readonly status: RegistrationStatusEnum;

  @ApiProperty({ example: 'Long enough rejection message', required: false })
  @IsNotBothPresent<RegistrationStatusPatchDto>('messageTemplateKey')
  public readonly message: string;

  @ApiProperty({
    enum: RegistrationStatusEnum,
    example: Object.keys(RegistrationStatusEnum).join(' | '),
    required: false,
  })
  @IsEnum(RegistrationStatusEnum)
  @IsOptional()
  public readonly messageTemplateKey: string;
}
