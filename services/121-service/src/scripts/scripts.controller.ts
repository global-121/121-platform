import { Body, Controller, HttpStatus, Post, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiProperty, ApiQuery } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { DataSource } from 'typeorm';
import SeedEthJointResponse from './seed-eth-joint-response';
import SeedMultipleNLRC from './seed-multiple-nlrc';
import { SeedDemoProgram } from './seed-program-demo';
import { SeedProgramDrc } from './seed-program-drc';
import { SeedProgramKrcs } from './seed-program-krcs';
import { SeedPilotNLProgram } from './seed-program-pilot-nl';
import { SeedPilotNL2Program } from './seed-program-pilot-nl-2';
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

@Controller('scripts')
export class ScriptsController {
  public constructor(private dataSource: DataSource) {}

  @ApiQuery({
    name: 'script',
    enum: SeedScript,
    isArray: true,
  })
  @ApiOperation({ summary: 'Reset database' })
  @Post('/reset')
  public async resetDb(
    @Body() body: SecretDto,
    @Query('script') script: SeedScript,
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
    } else if (script == SeedScript.pilotNL) {
      seed = new SeedPilotNLProgram(this.dataSource);
    } else if (script == SeedScript.pilotNLPV) {
      seed = new SeedPilotNL2Program(this.dataSource);
    } else if (script == SeedScript.DRC) {
      seed = new SeedProgramDrc(this.dataSource);
    } else if (script == SeedScript.validation) {
      seed = new SeedProgramValidation(this.dataSource);
    } else if (script == SeedScript.ethJointResponse) {
      seed = new SeedEthJointResponse(this.dataSource);
    } else if (script == SeedScript.krcs) {
      seed = new SeedProgramKrcs(this.dataSource);
    } else {
      return res.status(HttpStatus.BAD_REQUEST).send('Not a known program');
    }
    await seed.run();
    return res
      .status(HttpStatus.ACCEPTED)
      .send('Request received. Database should be reset.');
  }
}
