import { ApiProperty } from '@nestjs/swagger';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { SeedMessageTemplateConfig } from '@121-service/src/seed-data/message-template/interfaces/seed-message-template-config.interface';
import { WrapperType } from '@121-service/src/wrapper.type';

export class SeedConfigurationDto {
  @ApiProperty({ example: SeedScript.nlrcMultiple })
  readonly name: WrapperType<SeedScript>;

  @ApiProperty({ example: 'organization-generic.json' })
  readonly organization?: string;

  @ApiProperty({ default: false })
  readonly seedAdminOnly?: boolean;

  @ApiProperty()
  readonly projects: SeedConfigurationProjectDto[];

  @ApiProperty({ default: false })
  readonly includeMockData?: boolean;

  @ApiProperty({ default: false })
  readonly includeDebugScopes?: boolean;

  @ApiProperty({ default: 1 })
  readonly firstProjectId?: number;
}

export class SeedConfigurationProjectDto {
  @ApiProperty({ example: 'project-safaricom.json' })
  readonly project: string;

  @ApiProperty({ example: 'message-template-generic.json' })
  readonly messageTemplate: SeedMessageTemplateConfig;

  @ApiProperty({ example: 'mobile-money-999.csv' })
  readonly registrations?: string;
}
