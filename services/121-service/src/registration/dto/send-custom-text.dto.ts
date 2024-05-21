import { IsNotBothEmpty } from '@121-service/src/registration/validators/is-not-both-empty.class.validator';
import { IsNotBothPresent } from '@121-service/src/registration/validators/is-not-both-present.class.validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, ValidateIf } from 'class-validator';

export class SendCustomTextDto {
  @ApiProperty({
    example: 'Your voucher can be picked up at the location',
  })
  @IsNotBothPresent<SendCustomTextDto>('messageTemplateKey')
  @IsNotBothEmpty<SendCustomTextDto>('messageTemplateKey')
  @ValidateIf((o) => !o.skipMessageValidation)
  public readonly message: string;

  @ApiProperty({
    example: 'voucher-pickup-location',
  })
  @ValidateIf((o) => !o.skipMessageValidation)
  public readonly messageTemplateKey: string;

  @ApiProperty({
    example: 'false',
    description: 'Set this equal to dryRun',
  })
  @IsOptional()
  @IsBoolean()
  public readonly skipMessageValidation?: boolean;
}
