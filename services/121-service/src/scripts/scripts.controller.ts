import { Body, Controller, HttpStatus, Post, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiProperty, ApiQuery, ApiTags } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

import { IS_PRODUCTION } from '@121-service/src/config';
import { env } from '@121-service/src/env';
import { ApproverSeedMode } from '@121-service/src/scripts/enum/approval-seed-mode.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { ScriptsService } from '@121-service/src/scripts/services/scripts.service';
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
  @ApiQuery({
    name: 'resetIdentifier',
    required: false,
    description:
      'Optional identifier for this reset action, will be logged by the server.',
  })
  @ApiQuery({
    name: 'includeRegistrationEvents',
    required: false,
    description: `Set to 'true' to include registration events in the duplication.`,
    example: 'false',
  })
  @ApiQuery({
    name: 'approverMode',
    required: false,
    default: ApproverSeedMode.admin,
    enum: ApproverSeedMode,
    enumName: 'ApproverSeedMode',
    description:
      'Set approvers per seeded program. Possible values: none (no approvers, for prod-seed), admin (admin-user is approver, for local dev & testing), demo (configure one demo approver user)',
    example: ApproverSeedMode.admin,
  })
  @ApiOperation({
    summary: `Reset instance database.`,
    description: `When using the reset script: ${SeedScript.demoPrograms}. The reset can take a while, because of the large amount of data. This can result in a timeout on the client side, but the reset will still be done.`,
  })
  @Post('/reset')
  public async resetDb(
    @Body() body: SecretDto,
    @Query('script') script: WrapperType<SeedScript>,
    @Query('mockPowerNumberRegistrations')
    mockPowerNumberRegistrations: string,
    @Query('includeRegistrationEvents') includeRegistrationEvents: boolean,
    @Query('resetIdentifier') resetIdentifier: string,
    @Query('mockNumberPayments') mockNumberPayments: string,
    @Query('mockPowerNumberMessages') mockPowerNumberMessages: string,
    @Query('mockPv') mockPv: boolean,
    @Query('mockOcw') mockOcw: boolean,
    @Query('isApiTests') isApiTests: boolean,
    @Query('approverMode') approverMode: string,
    @Res() res,
  ): Promise<string> {
    if (body.secret !== env.RESET_SECRET) {
      return res.status(HttpStatus.FORBIDDEN).send('Not allowed');
    }

    isApiTests = isApiTests !== undefined && isApiTests.toString() === 'true';
    includeRegistrationEvents =
      includeRegistrationEvents !== undefined &&
      includeRegistrationEvents.toString() === 'true';

    if (script == SeedScript.nlrcMultipleMock) {
      const booleanMockPv = mockPv
        ? JSON.parse(mockPv as unknown as string)
        : true;
      const booleanMockOcw = mockOcw
        ? JSON.parse(mockOcw as unknown as string)
        : true;
      await this.scriptsService.loadSeedScenario({
        seedScript: SeedScript.nlrcMultipleMock,
        resetIdentifier,
        isApiTests,
        powerNrRegistrationsString: mockPowerNumberRegistrations,
        includeRegistrationEvents,
        nrPaymentsString: mockNumberPayments,
        powerNrMessagesString: mockPowerNumberMessages,
        mockPv: booleanMockPv,
        mockOcw: booleanMockOcw,
        approverMode: ApproverSeedMode.admin, // NLRC mock always seeds with admin approver
      });
    } else if (Object.values(SeedScript).includes(script)) {
      await this.scriptsService.loadSeedScenario({
        resetIdentifier,
        seedScript: script,
        isApiTests,
        approverMode: approverMode as ApproverSeedMode,
      });
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
  @ApiQuery({
    name: 'mockNumberPayments',
    required: false,
    description: `number of payments to add`,
    example: '1',
  })
  @ApiQuery({
    name: 'includeRegistrationEvents',
    required: false,
    description: `Set to 'true' to include registration events in the duplication.`,
    example: 'false',
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
    @Query('mockNumberPayments') mockNumberPayments: string,
    @Query('includeRegistrationEvents') includeRegistrationEvents: boolean,
    @Res() res,
  ): Promise<void> {
    if (body.secret !== env.RESET_SECRET) {
      return res.status(HttpStatus.FORBIDDEN).send('Not allowed');
    }
    if (IS_PRODUCTION) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .send(
          'Duplicating registrations is NOT allowed in production environments',
        );
    }
    await this.scriptsService.duplicateData({
      powerNrRegistrationsString: mockPowerNumberRegistrations,
      nrPaymentsString: mockNumberPayments,
      includeRegistrationEvents,
    });

    return res
      .status(HttpStatus.CREATED)
      .send('Request received. Data should have been duplicated.');
  }
}
