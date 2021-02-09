import { Controller, Post, Body, Res, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiModelProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { Connection } from 'typeorm';
import { SeedSingleProgram } from './seed-program-single';
import { SeedDemoProgram } from './seed-program-demo';
import { SeedPilotNLProgram } from './seed-program-pilot-nl';
import { SeedPilotNL2Program } from './seed-program-pilot-nl-2';
import { SeedPilotKenProgram } from './seed-program-pilot-ken';

enum SeedScript {
  pilotNL = 'pilot-nl',
  pilotNLPV = 'pilot-nl-pv',
  pilotKEN = 'pilot-ken',
  demo = 'demo',
  single = 'single',
}

class ResetDto {
  @ApiModelProperty({ example: 'fill_in_secret' })
  @IsNotEmpty()
  @IsString()
  public readonly secret: string;
  @ApiModelProperty({
    enum: SeedScript,
    example: Object.values(SeedScript).join(' | '),
  })
  public readonly script: string;
}

@Controller('scripts')
export class ScriptsController {
  public constructor(private connection: Connection) {}

  @ApiOperation({ title: 'Reset database' })
  @Post('/reset')
  public async resetDb(@Body() body: ResetDto, @Res() res): Promise<string> {
    if (body.secret !== process.env.RESET_SECRET) {
      return res.status(HttpStatus.FORBIDDEN).send('Not allowed');
    }
    let seed;
    if (body.script == SeedScript.demo) {
      seed = new SeedDemoProgram(this.connection);
    } else if (body.script == SeedScript.pilotNL) {
      seed = new SeedPilotNLProgram(this.connection);
    } else if (body.script == SeedScript.pilotNLPV) {
      seed = new SeedPilotNL2Program(this.connection);
    } else if (body.script == SeedScript.pilotKEN) {
      seed = new SeedPilotKenProgram(this.connection);
    } else {
      seed = new SeedSingleProgram(this.connection);
    }
    await seed.run();
    return res
      .status(HttpStatus.ACCEPTED)
      .send('Request received. The reset can take a minute.');
  }
}
