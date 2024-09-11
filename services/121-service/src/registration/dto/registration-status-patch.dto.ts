import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { IsNotBothPresent } from '@121-service/src/registration/validators/is-not-both-present.class.validator';
import { WrapperType } from '@121-service/src/wrapper.type';

export class RegistrationStatusPatchDto {
  @ApiProperty({
    example: RegistrationStatusEnum.included,
  })
  @IsEnum(RegistrationStatusEnum)
  public readonly status: WrapperType<RegistrationStatusEnum>;

  @ApiProperty({ example: 'Long enough rejection message', required: false })
  @IsNotBothPresent<RegistrationStatusPatchDto>('messageTemplateKey')
  @IsOptional()
  public readonly message?: string;

  @ApiProperty({
    enum: RegistrationStatusEnum,
    example: Object.keys(RegistrationStatusEnum).join(' | '),
    required: false,
  })
  @IsEnum(RegistrationStatusEnum)
  @IsOptional()
  public readonly messageTemplateKey?: string;
}
