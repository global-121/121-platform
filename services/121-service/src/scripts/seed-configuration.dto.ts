import { ApiProperty } from '@nestjs/swagger';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { WrapperType } from '@121-service/src/wrapper.type';

export class SeedConfigurationDto {
  @ApiProperty({ example: SeedScript.nlrcMultiple })
  readonly name: WrapperType<SeedScript>;

  @ApiProperty({ example: 'organization-generic.json' })
  readonly organization: string;

  @ApiProperty()
  readonly programs: SeedConfigurationProgramDto[];

  @ApiProperty({ default: false })
  readonly includeMockData?: boolean;

  @ApiProperty({ default: false })
  readonly includeDebugScopes?: boolean;

  @ApiProperty({ default: 1 })
  readonly firstProgramId?: number;
}

export class SeedConfigurationProgramDto {
  @ApiProperty({ example: 'program-safaricom.json' })
  readonly program: string;

  @ApiProperty({ example: 'message-template-generic.json' })
  readonly messageTemplate: string;
}
