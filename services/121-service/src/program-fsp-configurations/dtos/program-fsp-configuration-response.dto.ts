import { ApiProperty } from '@nestjs/swagger';

import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { FspSettingsDto } from '@121-service/src/fsp-management/fsp-settings.dto';
import { ProgramFspConfigurationPropertyResponseDto } from '@121-service/src/program-fsp-configurations/dtos/program-fsp-configuration-property-response.dto';
import { UILanguageTranslation } from '@121-service/src/shared/types/ui-language-translation.type';

type FspWithoutConfigProps = Omit<
  FspSettingsDto,
  'configurationProperties' | 'defaultLabel'
>;

export class ProgramFspConfigurationResponseDto {
  @ApiProperty({ example: 1, type: 'number' })
  public readonly programId: number;

  @ApiProperty({ enum: Fsps })
  public fspName: Fsps;

  @ApiProperty({ example: 'FSP Name', type: 'string' })
  public readonly name: string;

  @ApiProperty({ example: { en: 'FSP display name' } })
  public readonly label: UILanguageTranslation;

  /// Can sometimes be undefined if the Fsp has been removed from the codebase
  @ApiProperty()
  public readonly fsp?: FspWithoutConfigProps;

  @ApiProperty({
    example: [
      { name: 'password', updated: new Date() },
      { name: 'username', updated: new Date() },
    ],
    type: 'array',
    description: 'Only property names are returned for security reasons',
  })
  public readonly properties: ProgramFspConfigurationPropertyResponseDto[];
}
