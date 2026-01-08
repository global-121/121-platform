import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';
import { RegistrationsService } from '@121-service/src/registration/services/registrations.service';
import { ScopedUserRequest } from '@121-service/src/shared/scoped-user-request';
import { RequestHelper } from '@121-service/src/utils/request-helper/request-helper.helper';

// This has a seperate controller to clearly separate the Redline integration endpoint because these have a global program overencompassing scope
// and should not be mixed with the normal registrations endpoints that are always scoped to a program which have a different @ApiTags
// If you add api tags at endpoint level they appear multiple times in the swagger docs which is not desired.
@ApiTags('registrations-redline')
@UseGuards(AuthenticatedUserGuard)
@Controller()
export class RegistrationsRedlineController {
  public constructor(
    private readonly registrationsService: RegistrationsService,
  ) {}

  @AuthenticatedUser()
  @ApiTags('registrations')
  // There's no permission check here because there's a check included in the queries done to fetch data.
  @ApiOperation({
    summary:
      '[SCOPED] Find registration by phone-number for Redline integration and FieldValidation',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Return registrations that match the exact phone-number - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
  })
  @ApiQuery({
    name: 'phonenumber',
    required: true,
    type: 'string',
  })
  @Get('/registrations')
  public async searchRegistration(
    @Query('phonenumber') phonenumber: string,
    @Req() req: ScopedUserRequest,
  ) {
    const userId = RequestHelper.getUserId(req);

    if (typeof phonenumber !== 'string') {
      throw new HttpException(
        'phonenumber is not a string',
        HttpStatus.BAD_REQUEST,
      );
    }
    return await this.registrationsService.searchRegistration(
      phonenumber,
      userId,
    );
  }
}
