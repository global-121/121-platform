import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class SendCustomTextDto {
  @ApiProperty({
    example: 'Your voucher can be picked up at the location',
  })
  @IsString()
  @MinLength(1)
  @ValidateIf((o) => !o.skipMessageValidation && !o.messageTemplateKey)
  public readonly message: string;

  @ApiProperty({
    example: 'voucher-pickup-location',
  })
  @IsString()
  @ValidateIf((o) => !o.skipMessageValidation && !o.message)
  public readonly messageTemplateKey: string;

  @ApiProperty({
    example: 'false',
    description: 'Set this equal to dryRun',
  })
  @IsOptional()
  @IsBoolean()
  public readonly skipMessageValidation: boolean;
}
