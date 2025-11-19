import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { IsNotBothPresent } from '@121-service/src/registration/validators/is-not-both-present.class.validator';
import { IsOptionalIf } from '@121-service/src/registration/validators/is-optional-if.class.validator';
import { WrapperType } from '@121-service/src/wrapper.type';

const registrationStatusesForWhichReasonIsRequired = [
  RegistrationStatusEnum.declined,
  RegistrationStatusEnum.deleted,
  RegistrationStatusEnum.paused,
];

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

  @ApiProperty({
    description: `Reason is the same for all registration status changes in one API-call. Required for status changes to ${registrationStatusesForWhichReasonIsRequired.join(
      ', ',
    )}.`,
    example: 'Reason for update',
  })
  @IsString()
  @IsNotEmpty()
  @IsOptionalIf(
    (obj) => !registrationStatusesForWhichReasonIsRequired.includes(obj.status),
  )
  public readonly reason?: string;
}
