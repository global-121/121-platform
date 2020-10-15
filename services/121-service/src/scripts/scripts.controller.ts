import { Controller, Post, Body, Res, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiModelProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { Connection } from 'typeorm';
import { SeedProgramMin } from './seed-program-min';
import { SeedProgramMax } from './seed-program-max';
import { SeedDemoProgram } from './seed-program-demo';
import { SeedPilotNLProgram } from './seed-program-pilot-nl';
import { SeedPilotKenProgram } from './seed-program-pilot-ken';
import { SeedScript } from './scripts.enum';

class ResetDto {
  @ApiModelProperty({ example: 'fill_in_secret' })
  @IsNotEmpty()
  @IsString()
  public readonly secret: string;

  @ApiModelProperty({
    enum: SeedScript,
    example: `${SeedScript.pilotNL} | ${SeedScript.pilotKE} | ${SeedScript.demo} | ${SeedScript.max} | ${SeedScript.min}`,
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

    switch (body.script) {
      case SeedScript.demo:
        seed = new SeedDemoProgram(this.connection);
        break;
      case SeedScript.pilotNL:
        seed = new SeedPilotNLProgram(this.connection);
        break;
      case SeedScript.pilotKE:
        seed = new SeedPilotKenProgram(this.connection);
        break;
      case SeedScript.max:
        seed = new SeedProgramMax(this.connection);
        break;
      case SeedScript.min:
      default:
        seed = new SeedProgramMin(this.connection);
    }

    await seed.run();
    return res
      .status(HttpStatus.ACCEPTED)
      .send('Request received. The reset can take a minute.');
  }
}
