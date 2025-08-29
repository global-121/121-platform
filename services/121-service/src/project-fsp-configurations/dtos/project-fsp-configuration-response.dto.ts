import { ApiProperty } from '@nestjs/swagger';

import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { FspDto } from '@121-service/src/fsps/fsp.dto';
import { ProjectFspConfigurationPropertyResponseDto } from '@121-service/src/project-fsp-configurations/dtos/project-fsp-configuration-property-response.dto';
import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';

type FspWithoutConfigProps = Omit<
  FspDto,
  'configurationProperties' | 'defaultLabel'
>;

export class ProjectFspConfigurationResponseDto {
  @ApiProperty({ example: 1, type: 'number' })
  public readonly projectId: number;

  @ApiProperty({ enum: Fsps })
  public fspName: Fsps;

  @ApiProperty({ example: 'FSP Name', type: 'string' })
  public readonly name: string;

  @ApiProperty({ example: { en: 'FSP display name' } })
  public readonly label: LocalizedString;

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
  public readonly properties: ProjectFspConfigurationPropertyResponseDto[];
}
