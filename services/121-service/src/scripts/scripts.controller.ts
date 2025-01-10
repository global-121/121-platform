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
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { ScriptsService } from '@121-service/src/scripts/scripts.service';
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
  public constructor(private readonly scriptsService: ScriptsService) {}

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

    if (script == SeedScript.nlrcMultipleMock) {
      const booleanMockPv = mockPv
        ? JSON.parse(mockPv as unknown as string)
        : true;
      const booleanMockOcw = mockOcw
        ? JSON.parse(mockOcw as unknown as string)
        : true;
      await this.scriptsService.loadSeedScenario(
        SeedScript.nlrcMultipleMock,
        isApiTests,
        mockPowerNumberRegistrations,
        mockNumberPayments,
        mockPowerNumberMessages,
        booleanMockPv,
        booleanMockOcw,
      );
    } else if (Object.values(SeedScript).includes(script)) {
      await this.scriptsService.loadSeedScenario(script);
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
