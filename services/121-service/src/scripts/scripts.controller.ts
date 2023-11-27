import { Body, Controller, HttpStatus, Post, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiProperty, ApiQuery, ApiTags } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { DataSource } from 'typeorm';
import { SeedEthJointResponse } from './seed-eth-joint-response';
import { SeedMultipleKRCS } from './seed-multiple-krcs';
import { SeedMultipleNLRC } from './seed-multiple-nlrc';
import { SeedDemoProgram } from './seed-program-demo';
import { SeedProgramDrc } from './seed-program-drc';
import { SeedNLProgramLVV } from './seed-program-nlrc-lvv';
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
  public constructor(private dataSource: DataSource) {}

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
    name: 'isApiTests',
    required: false,
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
    @Query('isApiTests') isApiTests: boolean,
    @Res() res,
  ): Promise<string> {
    if (body.secret !== process.env.RESET_SECRET) {
      return res.status(HttpStatus.FORBIDDEN).send('Not allowed');
    }
    let seed;
    if (script == SeedScript.demo) {
      seed = new SeedDemoProgram(this.dataSource);
    } else if (script == SeedScript.test) {
      seed = new SeedTestProgram(this.dataSource);
    } else if (script == SeedScript.testMultiple) {
      seed = new SeedTestMultipleProgram(this.dataSource);
    } else if (script == SeedScript.nlrcMultiple) {
      seed = new SeedMultipleNLRC(this.dataSource);
    } else if (script == SeedScript.nlrcLVV) {
      seed = new SeedNLProgramLVV(this.dataSource);
    } else if (script == SeedScript.nlrcPV) {
      seed = new SeedNLProgramPV(this.dataSource);
    } else if (script == SeedScript.DRC) {
      seed = new SeedProgramDrc(this.dataSource);
    } else if (script == SeedScript.validation) {
      seed = new SeedProgramValidation(this.dataSource);
    } else if (script == SeedScript.ethJointResponse) {
      seed = new SeedEthJointResponse(this.dataSource);
    } else if (script == SeedScript.krcsMultiple) {
      seed = new SeedMultipleKRCS(this.dataSource);
    } else if (
      script == SeedScript.nlrcMultipleMock &&
      ['development', 'test'].includes(process.env.NODE_ENV)
    ) {
      const module = await import('./seed-multiple-nlrc-mock');
      const SeedMultipleNLRCMockData = module.SeedMultipleNLRCMockData;
      seed = new SeedMultipleNLRCMockData(this.dataSource);
    } else {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .send(
          'Not a known program (seed dummy only works in development and test)',
        );
    }
    await seed.run(
      isApiTests,
      mockPowerNumberRegistrations,
      mockNumberPayments,
      mockPowerNumberMessages,
    );
    return res
      .status(HttpStatus.ACCEPTED)
      .send('Request received. Database should be reset.');
  }
}
