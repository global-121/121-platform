import { Body, Controller, HttpStatus, Post, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiProperty, ApiQuery, ApiTags } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { SeedEthJointResponse } from './seed-eth-joint-response';
import { SeedInit } from './seed-init';
import { SeedMultipleKRCS } from './seed-multiple-krcs';
import { SeedMultipleNLRC } from './seed-multiple-nlrc';
import { SeedMultipleNLRCMockData } from './seed-multiple-nlrc-mock';
import { SeedDemoProgram } from './seed-program-demo';
import { SeedProgramDrc } from './seed-program-drc';
import { SeedNLProgramPV } from './seed-program-nlrc-pv';
import { SeedTestProgram } from './seed-program-test';
import { SeedTestMultipleProgram } from './seed-program-test-multiple';
import { SeedProgramValidation } from './seed-program-validation';
import { SeedScript } from './seed-script.enum';
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
    private readonly seedProgramDrc: SeedProgramDrc,
    private readonly seedEthJointRepose: SeedEthJointResponse,
    private readonly seedProgramNlrcPv: SeedNLProgramPV,
    private readonly seedProgramTestMultiple: SeedTestMultipleProgram,
    private readonly seedProgramTest: SeedTestProgram,
    private readonly seedProgramValidation: SeedProgramValidation,
    private readonly seedInit: SeedInit,
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
    @Query('script') script: SeedScript,
    @Query('mockPowerNumberRegistrations')
    mockPowerNumberRegistrations: number,
    @Query('mockNumberPayments') mockNumberPayments: number,
    @Query('mockPowerNumberMessages') mockPowerNumberMessages: number,
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
    } else if (script == SeedScript.testMultiple) {
      await this.seedProgramTestMultiple.run(isApiTests);
    } else if (script == SeedScript.nlrcMultiple) {
      await this.seedMultipleNlrc.run(isApiTests);
    } else if (script == SeedScript.nlrcPV) {
      await this.seedProgramNlrcPv.run(isApiTests);
    } else if (script == SeedScript.DRC) {
      await this.seedProgramDrc.run(isApiTests);
    } else if (script == SeedScript.validation) {
      await this.seedProgramValidation.run(isApiTests);
    } else if (script == SeedScript.ethJointResponse) {
      await this.seedEthJointRepose.run(isApiTests);
    } else if (script == SeedScript.krcsMultiple) {
      await this.seedMultipleKrcs.run(isApiTests);
    } else if (
      script == SeedScript.nlrcMultipleMock &&
      ['development', 'test'].includes(process.env.NODE_ENV)
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
}
