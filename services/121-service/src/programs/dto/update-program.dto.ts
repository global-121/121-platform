import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

import { CurrencyCode } from '@121-service/src/exchange-rates/enums/currency-code.enum';
import { BaseProgramDto } from '@121-service/src/programs/dto/base-program.dto';
import { UILanguageTranslationPartial } from '@121-service/src/shared/types/ui-language-translation-partial.type';
import { WrapperType } from '@121-service/src/wrapper.type';

// Because we allow patching, all fields are optional here.
export class UpdateProgramDto extends BaseProgramDto {
  @ApiProperty({ example: { en: 'title' } })
  @IsOptional()
  public readonly titlePortal?: UILanguageTranslationPartial;

  @ApiProperty({ example: 'MWK' })
  @IsOptional()
  @IsEnum(CurrencyCode)
  public readonly currency?: WrapperType<CurrencyCode>;

  // This DTO explicitly does not allow update of registrationAttributes.
  // We do that using separate endpoints and DTOs.
}
