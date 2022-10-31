import { Body, Controller, HttpStatus, Post, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiProperty, ApiQuery } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { Connection } from 'typeorm';
import { SeedDemoProgram } from './seed-program-demo';
import { SeedProgramDrc } from './seed-program-drc';
import SeedProgramEth from './seed-program-eth';
import { SeedProgramLbn } from './seed-program-lbn';
import { SeedPilotNLProgram } from './seed-program-pilot-nl';
import { SeedPilotNL2Program } from './seed-program-pilot-nl-2';
import { SeedTestProgram } from './seed-program-test';
import { SeedTestMultipleProgram } from './seed-program-test-multiple';
import SeedProgramUkr from './seed-program-ukr';
import { SeedProgramValidation } from './seed-program-validation';

enum SeedScript {
  pilotNL = 'pilot-nl',
  pilotNLPV = 'pilot-nl-pv',
  pilotETH = 'pilot-eth',
  pilotLBN = 'pilot-lbn',
  pilotUKR = 'pilot-ukr',
  DRC = 'drc',
  demo = 'demo',
  test = 'test',
  testMultiple = 'test-multiple',
  validation = 'validation',
}

class ResetDto {
  @ApiProperty({ example: 'fill_in_secret' })
  @IsNotEmpty()
  @IsString()
  public readonly secret: string;
}

@Controller('scripts')
export class ScriptsController {
  public constructor(private connection: Connection) {}
  @ApiQuery({
    name: 'script',
    enum: SeedScript,
    isArray: true,
  })
  @ApiOperation({ summary: 'Reset database' })
  @Post('/reset')
  public async resetDb(
    @Body() body: ResetDto,
    @Query('script') script: SeedScript,
    @Res() res,
  ): Promise<string> {
    if (body.secret !== process.env.RESET_SECRET) {
      return res.status(HttpStatus.FORBIDDEN).send('Not allowed');
    }
    let seed;
    if (script == SeedScript.demo) {
      seed = new SeedDemoProgram(this.connection);
    } else if (script == SeedScript.test) {
      seed = new SeedTestProgram(this.connection);
    } else if (script == SeedScript.testMultiple) {
      seed = new SeedTestMultipleProgram(this.connection);
    } else if (script == SeedScript.pilotNL) {
      seed = new SeedPilotNLProgram(this.connection);
    } else if (script == SeedScript.pilotNLPV) {
      seed = new SeedPilotNL2Program(this.connection);
    } else if (script == SeedScript.pilotETH) {
      seed = new SeedProgramEth(this.connection);
    } else if (script == SeedScript.pilotLBN) {
      seed = new SeedProgramLbn(this.connection);
    } else if (script == SeedScript.pilotUKR) {
      seed = new SeedProgramUkr(this.connection);
    } else if (script == SeedScript.DRC) {
      seed = new SeedProgramDrc(this.connection);
    } else if (script == SeedScript.validation) {
      seed = new SeedProgramValidation(this.connection);
    } else {
      return res.status(HttpStatus.BAD_REQUEST).send('Not a known program');
    }
    await seed.run();
    return res
      .status(HttpStatus.ACCEPTED)
      .send('Request received. The reset can take a minute.');
  }
}
