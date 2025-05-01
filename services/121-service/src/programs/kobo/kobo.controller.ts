import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';
import { KoboResponseDto } from '@121-service/src/programs/kobo/dto/kobo-response.dto';
import { KoboWebhookIncomingSubmission } from '@121-service/src/programs/kobo/dto/kobo-webhook-incoming-submission.dto';
import { LinkKoboDto } from '@121-service/src/programs/kobo/dto/link-kobo.dto';
import { KoboService } from '@121-service/src/programs/kobo/kobo.service';

@UseGuards(AuthenticatedUserGuard)
@ApiTags('kobo')
@Controller()
export class KoboController {
  public constructor(private readonly koboService: KoboService) {}

  @AuthenticatedUser({ isOrganizationAdmin: true })
  @ApiOperation({
    summary: `Link kobo form`,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Kobo has been linked',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
  })
  @ApiBody({
    type: LinkKoboDto,
    description: 'Kobo configuration data',
  })
  @ApiParam({
    name: 'programId',
    required: true,
    type: 'integer',
    example: 1,
  })
  @ApiQuery({
    name: 'dryRun',
    required: false,
    type: 'boolean',
    description: `
        Only when set explicitly to "true", this will simulate (and NOT actually DO) the action.
        Instead it will return how many PA this action can be applied to.
        So no registration statuses will be updated or messages will be sent.
        `,
  })
  @Post(`programs/:programId/kobo`)
  public async createKoboIntegration(
    @Body() linkKoboDto: LinkKoboDto,
    @Param('programId', ParseIntPipe)
    programId: number,
    @Query('dryRun') dryRun = 'false',
  ) {
    const dryRunBoolean = dryRun === 'true'; // defaults to false
    return this.koboService.createKoboIntegration({
      ...linkKoboDto,
      programId,
      dryRun: dryRunBoolean,
    });
  }

  @AuthenticatedUser({ isOrganizationAdmin: true })
  @ApiOperation({
    summary: `Get kobo form link from program`,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Kobo form link',
    type: KoboResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
  })
  @ApiParam({
    name: 'programId',
    required: true,
    type: 'integer',
    example: 1,
  })
  @Get(`programs/:programId/kobo`)
  public async getKoboIntegration(
    @Param('programId', ParseIntPipe)
    programId: number,
  ) {
    return this.koboService.getKoboIntegration(programId);
  }

  @AuthenticatedUser({ isOrganizationAdmin: true })
  @ApiOperation({
    summary: `Import Kobo form submissions as registrations`,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Submissions imported successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Error importing submissions',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Kobo integration not found for program',
  })
  @ApiParam({
    name: 'programId',
    required: true,
    type: 'integer',
    example: 1,
  })
  @Put(`programs/:programId/kobo/submissions`)
  public async importKoboSubmissionsAsRegistrations(
    @Param('programId', ParseIntPipe)
    programId: number,
  ) {
    await this.koboService.importKoboSubmissionsAsRegistrations(programId);
    return { success: true, message: 'Submissions imported successfully' };
  }

  @ApiOperation({
    summary: `Post a new kobo submission [USED BY KOBO]`,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Incoming submission processed successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
  })
  @ApiBody({
    type: KoboWebhookIncomingSubmission,
  })
  @ApiParam({
    name: 'programId',
    required: true,
    type: 'integer',
    example: 1,
  })
  @Post(`kobo/webhook`)
  public async processKoboWebhookCall(
    @Body() body: KoboWebhookIncomingSubmission,
  ) {
    await this.koboService.processKoboWebhookCall(body);
  }
}
