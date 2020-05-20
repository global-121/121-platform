import { Controller, Post, Body, Res, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiModelProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { Connection } from 'typeorm';
import { SeedSingleProgram } from './seed-single-program';

class ResetDto {
  @ApiModelProperty({ example: 'fill_in_secret' })
  @IsNotEmpty()
  @IsString()
  public readonly secret: string;
}

@Controller('scripts')
export class ScriptsController {
  public constructor(private connection: Connection) {}

  @ApiOperation({ title: 'Reset database' })
  @Post('/reset')
  public async resetDb(@Body() secret: ResetDto, @Res() res): Promise<string> {
    if (secret.secret !== process.env.RESET_SECRET) {
      return res.status(HttpStatus.FORBIDDEN).send('Not allowed');
    }
    const seedSingleProgram = new SeedSingleProgram(this.connection);
    await seedSingleProgram.run();
    return res
      .status(HttpStatus.ACCEPTED)
      .send('Request received. The reset can take a minute.');
  }
}
