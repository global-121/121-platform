import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  ParseArrayPipe,
  ParseBoolPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Paginate, PaginatedSwaggerDocs, PaginateQuery } from 'nestjs-paginate';

import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';
import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import { IntersolveVisaWalletDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dtos/internal/intersolve-visa-wallet.dto';
import {
  PaginateConfigRegistrationViewOnlyFilters,
  PaginateConfigRegistrationViewWithPayments,
} from '@121-service/src/registration/const/filter-operation.const';
import { BulkActionResultDto } from '@121-service/src/registration/dto/bulk-action-result.dto';
import {
  ImportRegistrationsDto,
  ImportResult,
} from '@121-service/src/registration/dto/bulk-import.dto';
import { FindAllRegistrationsResultDto } from '@121-service/src/registration/dto/find-all-registrations-result.dto';
import { MappedPaginatedRegistrationDto } from '@121-service/src/registration/dto/mapped-paginated-registration.dto';
import { MessageHistoryDto } from '@121-service/src/registration/dto/message-history.dto';
import { ReferenceIdDto } from '@121-service/src/registration/dto/reference-id.dto';
import { RegistrationStatusPatchDto } from '@121-service/src/registration/dto/registration-status-patch.dto';
import { SendCustomTextDto } from '@121-service/src/registration/dto/send-custom-text.dto';
import { UpdateRegistrationDto } from '@121-service/src/registration/dto/update-registration.dto';
import { GenericRegistrationAttributes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { RegistrationViewEntity } from '@121-service/src/registration/registration-view.entity';
import { RegistrationsService } from '@121-service/src/registration/registrations.service';
import { RegistrationsBulkService } from '@121-service/src/registration/services/registrations-bulk.service';
import { RegistrationsPaginationService } from '@121-service/src/registration/services/registrations-pagination.service';
import {
  FILE_UPLOAD_API_FORMAT,
  FILE_UPLOAD_WITH_REASON_API_FORMAT,
} from '@121-service/src/shared/file-upload-api-format';
import { ScopedUserRequest } from '@121-service/src/shared/scoped-user-request';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import { FinancialAttributes } from '@121-service/src/user/enum/registration-financial-attributes.const';
import { UserService } from '@121-service/src/user/user.service';
import { RequestHelper } from '@121-service/src/utils/request-helper/request-helper.helper';

@UseGuards(AuthenticatedUserGuard)
@Controller()
export class RegistrationsController {
  public constructor(
    private readonly registrationsService: RegistrationsService,
    private readonly registrationsPaginateService: RegistrationsPaginationService,
    private readonly registrationsBulkService: RegistrationsBulkService,
    private readonly userService: UserService,
  ) {}

  @ApiTags('programs/registrations')
  @AuthenticatedUser({ permissions: [PermissionEnum.RegistrationCREATE] })
  @ApiOperation({
    summary: 'Import set of registered PAs, from CSV',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @Post('programs/:programId/registrations/import')
  @ApiConsumes('multipart/form-data')
  @ApiBody(FILE_UPLOAD_API_FORMAT)
  @UseInterceptors(FileInterceptor('file'))
  public async importRegistrationsFromCsv(
    @UploadedFile() csvFile: Express.Multer.File,
    @Param('programId', ParseIntPipe)
    programId: number,
    @Req() req: ScopedUserRequest,
  ): Promise<ImportResult> {
    const userId = RequestHelper.getUserId(req);
    return await this.registrationsService.importRegistrationsFromCsv(
      csvFile,
      programId,
      userId,
    );
  }

  @ApiTags('programs/registrations')
  @AuthenticatedUser({ permissions: [PermissionEnum.RegistrationCREATE] })
  @ApiOperation({
    summary: '[EXTERNALLY USED] Import set of registered PAs',
    description:
      'Use this endpoint to create new registrations in a specific program. Note that the attributes depend on the program configuration. Authenticate first using the /login endpoint.',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiBody({ isArray: true, type: ImportRegistrationsDto })
  @Post('programs/:programId/registrations')
  public async importRegistrationsJSON(
    @Body(new ParseArrayPipe({ items: ImportRegistrationsDto }))
    data: ImportRegistrationsDto[],
    @Param('programId', ParseIntPipe)
    programId: number,
    @Req() req: ScopedUserRequest,
  ): Promise<ImportResult> {
    const userId = RequestHelper.getUserId(req);
    return await this.registrationsService.importRegistrationsFromJson(
      data as unknown as Record<string, string | number | boolean>[],
      programId,
      userId,
    );
  }

  @ApiTags('programs/registrations')
  @AuthenticatedUser({ permissions: [PermissionEnum.RegistrationREAD] })
  @ApiOperation({
    summary:
      '[SCOPED] Get paginated registrations. Below you will find all the default paginate options, including filtering on any generic fields. NOTE: additionally you can filter on program registration attributes, even though not specified in the Swagger Docs.',
  })
  @ApiParam({
    name: 'programId',
    required: true,
    type: 'integer',
  })
  @Get('programs/:programId/registrations')
  @PaginatedSwaggerDocs(
    RegistrationViewEntity,
    PaginateConfigRegistrationViewWithPayments,
  )
  public async findAll(
    @Paginate() query: PaginateQuery,
    @Req() req: ScopedUserRequest,
    @Param('programId', ParseIntPipe) programId: number,
  ): Promise<FindAllRegistrationsResultDto> {
    const userId = RequestHelper.getUserId(req);

    const hasPersonalRead =
      await this.registrationsPaginateService.userHasPermissionForProgram(
        userId,
        programId,
        PermissionEnum.RegistrationPersonalREAD,
      );

    await this.registrationsPaginateService.throwIfNoPermissionsForQuery(
      userId,
      programId,
      query,
    );

    return await this.registrationsPaginateService.getPaginate(
      query,
      Number(programId),
      hasPersonalRead,
      false,
    );
  }

  @AuthenticatedUser({ isOrganizationAdmin: true })
  @ApiTags('programs/registrations')
  @ApiOperation({
    summary: `Bulk update registration using a CSV file. The columns in the CSV file should contain at least referenceId and the columns you want to update. If you leave a cell empty the corresponding registration data will be update with an empty string. Max file length is 100k rows`,
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @Patch('programs/:programId/registrations')
  @ApiConsumes('multipart/form-data')
  @ApiBody(FILE_UPLOAD_WITH_REASON_API_FORMAT)
  @UseInterceptors(FileInterceptor('file'))
  public async patchRegistrations(
    @UploadedFile() csvFile: Express.Multer.File,
    @Body('reason') reason: string,
    @Param('programId', ParseIntPipe) programId: number,
    @Req() req: ScopedUserRequest,
  ): Promise<void> {
    const userId = RequestHelper.getUserId(req);

    return await this.registrationsService.patchBulk(
      csvFile,
      programId,
      userId,
      reason,
    );
  }

  @ApiTags('programs/registrations')
  @AuthenticatedUser({
    permissions: [PermissionEnum.RegistrationImportTemplateREAD],
  })
  @ApiOperation({
    summary: 'Get a CSV template for importing registrations',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @Get('programs/:programId/registrations/import/template')
  public async getImportRegistrationsTemplate(
    @Param('programId', ParseIntPipe) programId: number,
  ): Promise<string[]> {
    return await this.registrationsService.getImportRegistrationsTemplate(
      Number(programId),
    );
  }

  @AuthenticatedUser()
  @ApiTags('programs/registrations')
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Dry run result for the registration status update - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
    type: BulkActionResultDto,
  })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description:
      'The registration status update was succesfully started - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
    type: BulkActionResultDto,
  })
  @ApiOperation({
    summary:
      '[SCOPED] [EXTERNALLY USED] Update registration status of set of PAs that can be defined via filter parameters.',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @PaginatedSwaggerDocs(
    RegistrationViewEntity,
    PaginateConfigRegistrationViewOnlyFilters,
  )
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
  @ApiQuery({
    name: 'limit',
    required: false,
    type: 'boolean',
    description: 'Not used for this endpoint',
    deprecated: true,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: 'boolean',
    description: 'Not used for this endpoint',
    deprecated: true,
  })
  @HttpCode(HttpStatus.ACCEPTED)
  @Patch('programs/:programId/registrations/status')
  public async patchRegistrationsStatus(
    @Paginate() query: PaginateQuery,
    @Body() statusUpdateDto: RegistrationStatusPatchDto,
    @Req() req: ScopedUserRequest,
    @Param('programId', ParseIntPipe) programId: number,
    @Query('dryRun') dryRun = 'false',
  ): Promise<BulkActionResultDto> {
    let permission: PermissionEnum | undefined;
    let messageContentType: MessageContentType | undefined;
    const userId = RequestHelper.getUserId(req);

    const registrationStatus = statusUpdateDto.status;
    switch (registrationStatus) {
      case RegistrationStatusEnum.included:
        permission = PermissionEnum.RegistrationStatusIncludedUPDATE;
        messageContentType = MessageContentType.included;
        break;
      case RegistrationStatusEnum.paused:
        permission = PermissionEnum.RegistrationStatusPausedUPDATE;
        messageContentType = MessageContentType.paused;
        break;
      case RegistrationStatusEnum.validated:
        permission = PermissionEnum.RegistrationStatusMarkAsValidatedUPDATE;
        break;
      case RegistrationStatusEnum.declined:
        permission = PermissionEnum.RegistrationStatusMarkAsDeclinedUPDATE;
        break;
    }
    if (!permission) {
      const errors = `The status ${registrationStatus} is unknown or cannot be changed to via API`;
      throw new HttpException({ errors }, HttpStatus.BAD_REQUEST);
    }
    const hasPermissionToUpdateStatus =
      await this.registrationsPaginateService.userHasPermissionForProgram(
        userId,
        programId,
        permission,
      );
    if (!hasPermissionToUpdateStatus) {
      const errors = `User does not have permission to update registration status to ${registrationStatus}`;
      throw new HttpException({ errors }, HttpStatus.FORBIDDEN);
    }

    if (statusUpdateDto.message || statusUpdateDto.messageTemplateKey) {
      const hasPermissionToSendMessage =
        await this.registrationsPaginateService.userHasPermissionForProgram(
          userId,
          programId,
          PermissionEnum.RegistrationNotificationCREATE,
        );
      if (!hasPermissionToSendMessage) {
        const errors = `User does not have permission to send messages`;
        throw new HttpException({ errors }, HttpStatus.FORBIDDEN);
      }
    }

    await this.registrationsPaginateService.throwIfNoPermissionsForQuery(
      userId,
      programId,
      query,
    );
    const dryRunBoolean = dryRun === 'true'; // defaults to false
    const result = await this.registrationsBulkService.patchRegistrationsStatus(
      query,
      programId,
      registrationStatus as RegistrationStatusEnum,
      dryRunBoolean,
      userId,
      statusUpdateDto.message,
      statusUpdateDto.messageTemplateKey,
      messageContentType,
    );
    if (dryRunBoolean) {
      // If dryRun is true the status code is 200 because nothing changed (201) and nothin is going to change (202)
      // I did not find another way to send a different status code than with a HttpException
      throw new HttpException(result, HttpStatus.OK);
    }
    return result;
  }

  @AuthenticatedUser()
  @ApiTags('programs/registrations')
  @ApiOperation({
    summary:
      '[SCOPED] [EXTERNALLY USED] Update provided attributes of registration (Used by Aidworker)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Updated provided attributes of registration - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({ name: 'referenceId', required: true, type: 'string' })
  //Note: this endpoint must be placed below /programs/:programId/registrations/status to avoid conflict
  @Patch('programs/:programId/registrations/:referenceId')
  public async updateRegistration(
    @Param('programId', new ParseIntPipe()) programId: number,
    @Param('referenceId') referenceId: string,
    @Body() updateRegistrationDto: UpdateRegistrationDto,
    @Req() req: ScopedUserRequest,
  ) {
    const userId = RequestHelper.getUserId(req);

    const hasUpdateRegistrationPermission =
      await this.registrationsPaginateService.userHasPermissionForProgram(
        userId,
        programId,
        PermissionEnum.RegistrationAttributeUPDATE,
      );
    const hasUpdateFinancialPermission =
      await this.registrationsPaginateService.userHasPermissionForProgram(
        userId,
        programId,
        PermissionEnum.RegistrationAttributeFinancialUPDATE,
      );
    const hasUpdateFspConfigPermission =
      await this.registrationsPaginateService.userHasPermissionForProgram(
        userId,
        programId,
        PermissionEnum.RegistrationFspConfigUPDATE,
      );

    if (
      !hasUpdateRegistrationPermission &&
      !hasUpdateFinancialPermission &&
      !hasUpdateFspConfigPermission
    ) {
      const errors = `User does not have permission to update attributes`;
      throw new HttpException({ errors }, HttpStatus.FORBIDDEN);
    }

    const partialRegistration = updateRegistrationDto.data;

    for (const attributeKey of Object.keys(partialRegistration)) {
      if (
        FinancialAttributes.includes(attributeKey as keyof RegistrationEntity)
      ) {
        if (!hasUpdateFinancialPermission) {
          const errors = `User does not have permission to update financial attributes`;
          throw new HttpException({ errors }, HttpStatus.FORBIDDEN);
        }
      } else if (
        attributeKey ===
        GenericRegistrationAttributes.programFinancialServiceProviderConfigurationName
      ) {
        if (!hasUpdateFspConfigPermission) {
          const errors = `User does not have permission to update chosen program financial service provider configuration`;
          throw new HttpException({ errors }, HttpStatus.FORBIDDEN);
        }
      } else {
        if (!hasUpdateRegistrationPermission) {
          const errors = `User does not have permission to update attributes`;
          throw new HttpException({ errors }, HttpStatus.FORBIDDEN);
        }
      }
    }

    return await this.registrationsService.validateInputAndUpdateRegistration({
      programId,
      referenceId,
      updateRegistrationDto,
      userId,
    });
  }

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

  @ApiTags('programs/registrations')
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Dry run result for deleting set of registrations - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
    type: BulkActionResultDto,
  })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description:
      'Deleting set of registrations was succesfully started - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
    type: BulkActionResultDto,
  })
  @PaginatedSwaggerDocs(
    RegistrationViewEntity,
    PaginateConfigRegistrationViewOnlyFilters,
  )
  @ApiQuery({
    name: 'dryRun',
    required: false,
    type: 'boolean',
    description: `
      Only when set explicitly to "true", this will simulate (and NOT actually DO) the action.
      Instead it will return how many PA this action can be applied to.
      No registrations will be deleted.
      `,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: 'boolean',
    description: 'Not used for this endpoint',
    deprecated: true,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: 'boolean',
    description: 'Not used for this endpoint',
    deprecated: true,
  })
  @HttpCode(HttpStatus.ACCEPTED)
  @AuthenticatedUser({ permissions: [PermissionEnum.RegistrationDELETE] })
  @ApiOperation({ summary: '[SCOPED] Delete set of registrations' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @Delete('programs/:programId/registrations')
  public async delete(
    @Paginate() query: PaginateQuery,
    @Req() req: ScopedUserRequest,
    @Param('programId') programId: number,
    @Query('dryRun') dryRun = 'false', // Query decorator can be used in combi with Paginate decorator
  ): Promise<BulkActionResultDto> {
    const userId = RequestHelper.getUserId(req);

    await this.registrationsPaginateService.throwIfNoPermissionsForQuery(
      userId,
      programId,
      query,
    );

    const dryRunBoolean = dryRun === 'true'; // defaults to false
    const result = await this.registrationsBulkService.deleteRegistrations(
      query,
      programId,
      dryRunBoolean,
      userId,
    );

    if (dryRunBoolean) {
      // If dryRun is true the status code is 200 because nothing changed (201) and nothin is going to change (202)
      // I did not find another way to send a different status code than with a HttpException
      throw new HttpException(result, HttpStatus.OK);
    }
    return result;
  }

  @ApiTags('programs/registrations')
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Dry run result for sending a bulk message - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
    type: BulkActionResultDto,
  })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description:
      'Sending bulk message was succesfully started - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
    type: BulkActionResultDto,
  })
  @ApiOperation({
    summary:
      '[SCOPED] Sends custom message via sms or whatsapp to set of PAs that can be defined via filter parameters.',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @PaginatedSwaggerDocs(
    RegistrationViewEntity,
    PaginateConfigRegistrationViewOnlyFilters,
  )
  @ApiQuery({
    name: 'dryRun',
    required: false,
    type: 'boolean',
    description: `
      Only when set explicitly to "true", this will simulate (and NOT actually DO) the action.
      Instead it will return how many PA this action can be applied to.
      No messages will be sent.
      `,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: 'boolean',
    description: 'Not used for this endpoint',
    deprecated: true,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: 'boolean',
    description: 'Not used for this endpoint',
    deprecated: true,
  })
  @HttpCode(HttpStatus.ACCEPTED)
  @AuthenticatedUser({
    permissions: [PermissionEnum.RegistrationNotificationCREATE],
  })
  @Post('programs/:programId/registrations/message')
  public async sendCustomTextMessage(
    @Body() body: SendCustomTextDto,
    @Paginate() query: PaginateQuery,
    @Req() req: ScopedUserRequest,
    @Param('programId', ParseIntPipe) programId: number,
    @Query('dryRun') dryRun = 'false', // Query decorator can be used in combi with Paginate decorator
  ): Promise<BulkActionResultDto> {
    const userId = RequestHelper.getUserId(req);

    await this.registrationsPaginateService.throwIfNoPermissionsForQuery(
      userId,
      programId,
      query,
    );
    const dryRunBoolean = dryRun === 'true'; // defaults to false
    if (!dryRunBoolean && body.skipMessageValidation) {
      throw new HttpException(
        'skipping Message Validation is only allowed in dryRun case',
        HttpStatus.BAD_REQUEST,
      );
    }
    const result = await this.registrationsBulkService.postMessages(
      query,
      programId,
      body.message,
      body.messageTemplateKey,
      dryRunBoolean,
      userId,
    );

    if (dryRunBoolean) {
      // If dryRun is true the status code is 200 because nothing changed (201) and nothin is going to change (202)
      // I did not find another way to send a different status code than with a HttpException
      throw new HttpException(result, HttpStatus.OK);
    }
    return result;
  }

  @ApiTags('programs/registrations')
  @AuthenticatedUser({
    permissions: [PermissionEnum.RegistrationNotificationREAD],
  })
  @ApiOperation({
    summary: '[SCOPED] Get message history for one registration',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Message history retrieved - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
  })
  @Get('programs/:programId/registrations/:referenceId/messages')
  public async getMessageHistoryRegistration(
    @Param() params: ReferenceIdDto,
  ): Promise<MessageHistoryDto[]> {
    return await this.registrationsService.getMessageHistoryRegistration(
      params.referenceId,
    );
  }

  @ApiTags('programs/registrations')
  @AuthenticatedUser({ permissions: [PermissionEnum.RegistrationREAD] })
  @ApiOperation({ summary: '[SCOPED] Get Person Affected referenceId' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({ name: 'paId', required: true, type: 'integer' })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'ReferenceId retrieved - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
  })
  @Get('programs/:programId/registrations/referenceid/:paId')
  public async getReferenceId(
    @Param() params: { programId: number; paId: number },
  ): Promise<RegistrationEntity | null> {
    if (isNaN(params.paId)) {
      throw new HttpException('paId is not a number', HttpStatus.BAD_REQUEST);
    }

    return await this.registrationsService.getReferenceId(
      params.programId,
      params.paId,
    );
  }

  // Re-issue card: this is placed in registrationscontroller because it also sends messages and searches by referenceId
  @ApiTags('financial-service-providers/intersolve-visa')
  @AuthenticatedUser({ permissions: [PermissionEnum.FspDebitCardCREATE] })
  @ApiOperation({
    summary: '[SCOPED] Re-issue card: replace existing card with a new card.',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({ name: 'referenceId', required: true, type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Card replaced - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
  })
  @Post(
    'programs/:programId/registrations/:referenceId/financial-service-providers/intersolve-visa/wallet/cards',
  )
  @HttpCode(HttpStatus.NO_CONTENT)
  public async reissueCardAndSendMessage(
    @Param('programId', ParseIntPipe) programId: number,
    @Param('referenceId') referenceId: string,
    @Req() req,
  ): Promise<void> {
    const userId = req.user.id;

    await this.registrationsService.reissueCardAndSendMessage(
      referenceId,
      programId,
      userId,
    );
  }

  @ApiTags('financial-service-providers/intersolve-visa')
  @AuthenticatedUser()
  @ApiOperation({
    summary: '[SCOPED] [EXTERNALLY USED] Pause Intersolve Visa Card',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({ name: 'referenceId', required: true, type: 'string' })
  @ApiParam({ name: 'tokenCode', required: true, type: 'string' })
  @ApiQuery({ name: 'pause', type: 'boolean' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description:
      'Body.status 204: Paused card, stored in 121 db and sent notification to registration. - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
  })
  @Patch(
    'programs/:programId/registrations/:referenceId/financial-service-providers/intersolve-visa/wallet/cards/:tokenCode',
  )
  public async pauseCardAndSendMessage(
    @Param('programId', ParseIntPipe) programId: number,
    @Param('referenceId') referenceId: string,
    @Param('tokenCode') tokenCode: string,
    @Query('pause', ParseBoolPipe) pause: boolean,
    @Req() req,
  ) {
    const userId = req.user.id;
    const permisson = pause
      ? PermissionEnum.FspDebitCardBLOCK
      : PermissionEnum.FspDebitCardUNBLOCK;

    const hasPermission = await this.userService.canActivate(
      [permisson],
      programId,
      userId,
    );

    if (!hasPermission) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }

    if (pause === undefined) {
      throw new HttpException(
        'No pause value (true/false) provided in query parameter',
        HttpStatus.BAD_REQUEST,
      );
    }

    return await this.registrationsService.pauseCardAndSendMessage(
      referenceId,
      programId,
      tokenCode,
      pause,
      userId,
    );
  }

  @ApiTags('financial-service-providers/intersolve-visa')
  @AuthenticatedUser({ permissions: [PermissionEnum.FspDebitCardREAD] })
  @ApiOperation({
    summary:
      '[SCOPED] [EXTERNALLY USED] Retrieves and updates latest wallet and cards data for a Registration from Intersolve and returns it',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({ name: 'referenceId', required: true, type: 'string' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description:
      'Wallet and cards data retrieved from intersolve and updated in the 121 Platform. - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
    type: IntersolveVisaWalletDto,
  })
  @Patch(
    'programs/:programId/registrations/:referenceId/financial-service-providers/intersolve-visa/wallet',
  )
  public async retrieveAndUpdateIntersolveVisaWalletAndCards(
    @Param('referenceId') referenceId: string,
    @Param('programId', ParseIntPipe)
    programId: number,
  ): Promise<IntersolveVisaWalletDto> {
    return await this.registrationsService.retrieveAndUpdateIntersolveVisaWalletAndCards(
      referenceId,
      programId,
    );
  }

  @ApiTags('financial-service-providers/intersolve-visa')
  @AuthenticatedUser({ permissions: [PermissionEnum.FspDebitCardREAD] })
  @ApiOperation({
    summary:
      '[SCOPED] Gets wallet and cards data for a Registration and returns it',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({ name: 'referenceId', required: true, type: 'string' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description:
      'Wallet and cards data retrieved from database. - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
    type: IntersolveVisaWalletDto,
  })
  @Get(
    'programs/:programId/registrations/:referenceId/financial-service-providers/intersolve-visa/wallet',
  )
  public async getIntersolveVisaWalletAndCards(
    @Param('referenceId') referenceId: string,
    @Param('programId', ParseIntPipe)
    programId: number,
  ): Promise<IntersolveVisaWalletDto> {
    return await this.registrationsService.getIntersolveVisaWalletAndCards(
      referenceId,
      programId,
    );
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary: 'Send Visa Customer Information of a registration to Intersolve',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({ name: 'referenceId', required: true, type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Customer data sent',
  })
  @Post(
    'programs/:programId/registrations/:referenceId/financial-service-providers/intersolve-visa/contact-information',
  )
  public async getRegistrationAndSendContactInformationToIntersolve(
    @Param('programId', ParseIntPipe) programId: number,
    @Param('referenceId') referenceId: string,
  ): Promise<void> {
    return await this.registrationsService.getRegistrationAndSendContactInformationToIntersolve(
      referenceId,
      programId,
    );
  }

  // This "wildcard" endpoint needs to be at the bottom of the file to avoid conflicts with other endpoints
  @ApiTags('programs/registrations')
  @AuthenticatedUser({ permissions: [PermissionEnum.RegistrationREAD] })
  @ApiOperation({
    summary:
      '[SCOPED] Get a specific registration view based on registration id.',
  })
  @ApiParam({
    name: 'programId',
    required: true,
    type: 'integer',
  })
  @ApiParam({
    name: 'id',
    required: true,
    type: 'integer',
  })
  @Get('programs/:programId/registrations/:id')
  public async findOne(
    @Param('programId', ParseIntPipe) programId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<MappedPaginatedRegistrationDto> {
    const registrationEntity =
      await this.registrationsService.getPaginateRegistrationById({
        id,
        programId,
      });

    if (!registrationEntity) {
      throw new HttpException(
        `No registration found for id ${id}`,
        HttpStatus.NOT_FOUND,
      );
    }

    return registrationEntity;
  }
}
