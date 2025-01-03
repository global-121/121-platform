import { Body, Controller, HttpStatus, Post, Query, Res } from '@nestjs/common';
import {
  ApiExcludeEndpoint,
  ApiOperation,
  ApiProperty,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

import { DEBUG } from '@121-service/src/config';
import { ScriptsService } from '@121-service/src/scripts/scripts.service';
import { SeedEthJointResponse } from '@121-service/src/scripts/seed-eth-joint-response';
import { SeedInit } from '@121-service/src/scripts/seed-init';
import { SeedMultipleKRCS } from '@121-service/src/scripts/seed-multiple-krcs';
import { SeedMultipleNLRC } from '@121-service/src/scripts/seed-multiple-nlrc';
import { SeedMultipleNLRCMockData } from '@121-service/src/scripts/seed-multiple-nlrc-mock';
import { SeedDemoProgram } from '@121-service/src/scripts/seed-program-demo';
import { SeedNLProgramPV } from '@121-service/src/scripts/seed-program-nlrc-pv';
import { SeedTestProgram } from '@121-service/src/scripts/seed-program-test';
import { SeedTestMultipleProgram } from '@121-service/src/scripts/seed-program-test-multiple';
import { SeedTestOneAdmin } from '@121-service/src/scripts/seed-program-test-one-admin';
import { SeedProgramValidation } from '@121-service/src/scripts/seed-program-validation';
import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import { WrapperType } from '@121-service/src/wrapper.type';
export class SecretDto {
  @ApiProperty({ example: 'fill_in_secret' })
  @IsNotEmpty()
  @IsString()
  public readonly secret: string;
}

@ApiTags('instance')
// TODO: REFACTOR: rename to instance
@Controller('scripts')
export class ScriptsController {
  public constructor(
    private readonly seedMultipleKrcs: SeedMultipleKRCS,
    private readonly seedMultipleNlrcMockData: SeedMultipleNLRCMockData,
    private readonly seedMultipleNlrc: SeedMultipleNLRC,
    private readonly seedDemoProgram: SeedDemoProgram,
    private readonly seedEthJointRepose: SeedEthJointResponse,
    private readonly seedProgramNlrcPv: SeedNLProgramPV,
    private readonly seedProgramTestMultiple: SeedTestMultipleProgram,
    private readonly seedProgramTest: SeedTestProgram,
    private readonly seedProgramOneAdmin: SeedTestOneAdmin,
    private readonly seedProgramValidation: SeedProgramValidation,
    private readonly seedInit: SeedInit,
    private readonly scriptsService: ScriptsService,
  ) {}

  @ApiQuery({
    name: 'script',
    enum: SeedScript,
    isArray: true,
  })
  @ApiQuery({
    name: 'mockPowerNumberRegistrations',
    required: false,
    description: `Only for ${SeedScript.nlrcMultipleMock}: number of times to duplicate all PAs (2^x, e.g. 15=32,768 PAs)`,
  })
  @ApiQuery({
    name: 'mockNumberPayments',
    required: false,
    description: `Only for ${SeedScript.nlrcMultipleMock}: number of payments per PA to create`,
  })
  @ApiQuery({
    name: 'mockPowerNumberMessages',
    required: false,
    description: `Only for ${SeedScript.nlrcMultipleMock}: number of times to duplicate all messages (2^x, e.g. 4=16 messages per PA)`,
  })
  @ApiQuery({
    name: 'mockPv',
    required: false,
    example: true,
    description: `Only for ${SeedScript.nlrcMultipleMock}: set to false to not mock PV program`,
  })
  @ApiQuery({
    name: 'mockOcw',
    required: false,
    example: true,
    description: `Only for ${SeedScript.nlrcMultipleMock}: set to false to not mock OCW program`,
  })
  @ApiQuery({
    name: 'isApiTests',
    required: false,
    example: 'false',
    description: `Only for API tests`,
  })
  @ApiOperation({ summary: 'Reset instance database' })
  @Post('/reset')
  public async resetDb(
    @Body() body: SecretDto,
    @Query('script') script: WrapperType<SeedScript>,
    @Query('mockPowerNumberRegistrations')
    mockPowerNumberRegistrations: string,
    @Query('mockNumberPayments') mockNumberPayments: string,
    @Query('mockPowerNumberMessages') mockPowerNumberMessages: string,
    @Query('mockPv') mockPv: boolean,
    @Query('mockOcw') mockOcw: boolean,
    @Query('isApiTests') isApiTests: boolean,
    @Res() res,
  ): Promise<string> {
    if (body.secret !== process.env.RESET_SECRET) {
      return res.status(HttpStatus.FORBIDDEN).send('Not allowed');
    }

    isApiTests = isApiTests !== undefined && isApiTests.toString() === 'true';

    // If script is in seed enum and does not inculde mock data
    if (
      Object.values(SeedScript).includes(script) &&
      script != SeedScript.nlrcMultipleMock
    ) {
      await this.seedInit.run(isApiTests);
    }
    if (script == SeedScript.demo) {
      await this.seedDemoProgram.run(isApiTests);
    } else if (script == SeedScript.test) {
      await this.seedProgramTest.run(isApiTests);
    } else if (script == SeedScript.oneAdmin) {
      await this.seedProgramOneAdmin.run(isApiTests);
    } else if (script == SeedScript.testMultiple) {
      await this.seedProgramTestMultiple.run(isApiTests);
    } else if (script == SeedScript.nlrcMultiple) {
      await this.seedMultipleNlrc.run(isApiTests);
    } else if (script == SeedScript.nlrcPV) {
      await this.seedProgramNlrcPv.run(isApiTests);
    } else if (script == SeedScript.validation) {
      await this.seedProgramValidation.run(isApiTests);
    } else if (script == SeedScript.ethJointResponse) {
      await this.seedEthJointRepose.run(isApiTests);
    } else if (script == SeedScript.krcsMultiple) {
      await this.seedMultipleKrcs.run(isApiTests);
    } else if (
      script == SeedScript.nlrcMultipleMock &&
      ['development', 'test'].includes(process.env.NODE_ENV!)
    ) {
      const booleanMockPv = mockPv
        ? JSON.parse(mockPv as unknown as string)
        : true;
      const booleanMockOcw = mockOcw
        ? JSON.parse(mockOcw as unknown as string)
        : true;
      await this.seedInit.run(isApiTests);
      await this.seedMultipleNlrcMockData.run(
        isApiTests,
        mockPowerNumberRegistrations,
        mockNumberPayments,
        mockPowerNumberMessages,
        booleanMockPv,
        booleanMockOcw,
      );
    } else {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .send(
          'Not a known program (seed dummy only works in development and test)',
        );
    }
    return res
      .status(HttpStatus.ACCEPTED)
      .send('Request received. Database should be reset.');
  }

  @ApiQuery({
    name: 'mockPowerNumberRegistrations',
    required: false,
    description: `number of times to duplicate all PAs (2^x, e.g. 15=32,768 PAs)`,
    example: '1',
  })
  @ApiOperation({
    summary:
      'Duplicate registrations, used for load testing. It also changes all phonenumber to a random number. Only usable in test or development.',
  })
  @Post('/duplicate-registrations')
  public async duplicateData(
    @Body() body: SecretDto,
    @Query('mockPowerNumberRegistrations')
    mockPowerNumberRegistrations: string,
    @Res() res,
  ): Promise<void> {
    if (body.secret !== process.env.RESET_SECRET) {
      return res.status(HttpStatus.FORBIDDEN).send('Not allowed');
    }
    if (!['development', 'test'].includes(process.env.NODE_ENV!)) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .send('Not allowed in this environment. Only for development and test');
    }
    await this.scriptsService.duplicateData(mockPowerNumberRegistrations);

    return res
      .status(HttpStatus.CREATED)
      .send('Request received. Data should have been duplicated.');
  }

  @ApiOperation({
    summary:
      'WARNING: Kills 121-service. Only works in DEBUG-mode. Only used for testing purposes.',
  })
  @ApiExcludeEndpoint(!DEBUG)
  @Post('kill-service')
  killService(@Body() body: SecretDto, @Res() res): void {
    if (body.secret !== process.env.RESET_SECRET) {
      return res.status(HttpStatus.FORBIDDEN).send('Not allowed');
    }
    if (!DEBUG) {
      return;
    }

    console.log('Service is being killed...');
    process.exit(1); // Exit with a non-zero status code to indicate an error
  }
}
