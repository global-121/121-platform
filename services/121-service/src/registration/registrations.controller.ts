import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';
import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import {
  PaginateConfigRegistrationViewOnlyFilters,
  PaginateConfigRegistrationViewWithPayments,
} from '@121-service/src/registration/const/filter-operation.const';
import { BulkActionResultDto } from '@121-service/src/registration/dto/bulk-action-result.dto';
import {
  ImportRegistrationsDto,
  ImportResult,
} from '@121-service/src/registration/dto/bulk-import.dto';
import { MessageHistoryDto } from '@121-service/src/registration/dto/message-history.dto';
import { ReferenceIdDto } from '@121-service/src/registration/dto/reference-id.dto';
import { RegistrationStatusPatchDto } from '@121-service/src/registration/dto/registration-status-patch.dto';
import { SendCustomTextDto } from '@121-service/src/registration/dto/send-custom-text.dto';
import { UpdateChosenFspDto } from '@121-service/src/registration/dto/set-fsp.dto';
import { UpdateRegistrationDto } from '@121-service/src/registration/dto/update-registration.dto';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { RegistrationDataScopedRepository } from '@121-service/src/registration/modules/registration-data/repositories/registration-data.scoped.repository';
import { RegistrationViewEntity } from '@121-service/src/registration/registration-view.entity';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { RegistrationsService } from '@121-service/src/registration/registrations.service';
import { RegistrationsBulkService } from '@121-service/src/registration/services/registrations-bulk.service';
import { RegistrationsPaginationService } from '@121-service/src/registration/services/registrations-pagination.service';
import { FILE_UPLOAD_API_FORMAT } from '@121-service/src/shared/file-upload-api-format';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import { FinancialAttributes } from '@121-service/src/user/enum/registration-financial-attributes.const';
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
  Put,
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
import { Paginate, PaginateQuery, PaginatedSwaggerDocs } from 'nestjs-paginate';

@UseGuards(AuthenticatedUserGuard)
@Controller()
export class RegistrationsController {
  public constructor(
    private readonly registrationsService: RegistrationsService,
    private readonly registrationsPaginateService: RegistrationsPaginationService,
    private readonly registrationsBulkService: RegistrationsBulkService,
    private readonly registrationDataScopedRepository: RegistrationDataScopedRepository,
  ) {}

  @ApiTags('programs/registrations')
  @AuthenticatedUser({ permissions: [PermissionEnum.RegistrationCREATE] })
  @ApiOperation({
    summary: 'Import set of registered PAs, from CSV',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @Post('programs/:programId/registrations/import-registrations')
  @ApiConsumes('multipart/form-data')
  @ApiBody(FILE_UPLOAD_API_FORMAT)
  @UseInterceptors(FileInterceptor('file'))
  public async importRegistrations(
    @UploadedFile() csvFile,
    @Param('programId', ParseIntPipe)
    programId: number,
    @Req() req,
  ): Promise<ImportResult> {
    const userId = req.user.id;

    return await this.registrationsService.importRegistrations(
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
  @Post('programs/:programId/registrations/import')
  public async importRegistrationsJSON(
    @Body(new ParseArrayPipe({ items: ImportRegistrationsDto }))
    data: ImportRegistrationsDto[],
    @Param('programId', ParseIntPipe)
    programId: number,
    @Query() queryParams,
    @Req() req,
  ): Promise<ImportResult> {
    const validation = !queryParams.validation ?? true;
    const userId = req.user.id;

    if (validation) {
      const validatedData =
        await this.registrationsService.importJsonValidateRegistrations(
          data,
          programId,
          userId,
        );
      return await this.registrationsService.importValidatedRegistrations(
        validatedData,
        programId,
        userId,
      );
    } else {
      return await this.registrationsService.importValidatedRegistrations(
        data,
        programId,
        userId,
      );
    }
  }

  @ApiTags('programs/registrations')
  @AuthenticatedUser({ permissions: [PermissionEnum.RegistrationREAD] })
  @ApiOperation({
    summary:
      '[SCOPED] Get paginated registrations. Below you will find all the default paginate options, including filtering on any generic fields. NOTE: additionally you can filter on program-specific fields, like program questions, fsp questions, and custom attributes, even though not specified in the Swagger Docs.',
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
    @Req() req,
    @Param('programId', ParseIntPipe) programId: number,
  ) {
    const userId = req.user.id;

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

  @AuthenticatedUser({ isAdmin: true })
  @ApiTags('programs/registrations')
  @ApiOperation({
    summary: `Bulk update registration using a CSV file. The columns in the CSV file should contain at least referenceId and the columns you want to update. If you leave a cell empty the corresponding registration data will be update with an empty string. Max file length is 100k rows`,
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @Patch('programs/:programId/registrations')
  @ApiConsumes('multipart/form-data')
  @ApiBody(FILE_UPLOAD_API_FORMAT)
  @UseInterceptors(FileInterceptor('file'))
  public async patchRegistrations(
    @UploadedFile() csvFile: any,
    @Param('programId', ParseIntPipe) programId: number,
    @Req() req,
  ): Promise<void> {
    const userId = req.user.id;
    return await this.registrationsService.patchBulk(
      csvFile,
      programId,
      userId,
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
  @Get('programs/:programId/registrations/import-template')
  public async getImportRegistrationsTemplate(
    @Param() params,
  ): Promise<string[]> {
    return await this.registrationsService.getImportRegistrationsTemplate(
      Number(params.programId),
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
    @Req() req,
    @Param('programId', ParseIntPipe) programId: number,
    @Query() queryParams, // Query decorator can be used in combi with Paginate decorator
  ): Promise<BulkActionResultDto> {
    let permission: PermissionEnum | undefined;
    let messageContentType: MessageContentType | undefined;
    const userId = req.user.id;
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
    const dryRun = queryParams.dryRun === 'true'; // defaults to false
    const result = await this.registrationsBulkService.patchRegistrationsStatus(
      query,
      programId,
      registrationStatus as RegistrationStatusEnum,
      dryRun,
      statusUpdateDto.message,
      statusUpdateDto.messageTemplateKey,
      messageContentType,
    );
    if (dryRun) {
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
    @Body() updateRegistrationDataDto: UpdateRegistrationDto,
    @Req() req,
  ) {
    const userId = req.user.id;
    const hasRegistrationUpdatePermission =
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

    if (!hasRegistrationUpdatePermission && !hasUpdateFinancialPermission) {
      const errors = `User does not have permission to update attributes`;
      throw new HttpException({ errors }, HttpStatus.FORBIDDEN);
    }

    const partialRegistration = updateRegistrationDataDto.data;

    if (!hasUpdateFinancialPermission && hasRegistrationUpdatePermission) {
      for (const attributeKey of Object.keys(partialRegistration)) {
        if (
          FinancialAttributes.includes(attributeKey as keyof RegistrationEntity)
        ) {
          const errors = `User does not have permission to update financial attributes`;
          throw new HttpException({ errors }, HttpStatus.FORBIDDEN);
        }
      }
    }

    if (hasUpdateFinancialPermission && !hasRegistrationUpdatePermission) {
      for (const attributeKey of Object.keys(partialRegistration)) {
        if (
          !FinancialAttributes.includes(
            attributeKey as keyof RegistrationEntity,
          )
        ) {
          const errors = `User does not have permission to update attributes`;
          throw new HttpException({ errors }, HttpStatus.FORBIDDEN);
        }
      }
    }

    // first validate all attributes and return error if any
    for (const attributeKey of Object.keys(partialRegistration)) {
      await this.registrationsService.validateAttribute(
        referenceId,
        attributeKey,
        partialRegistration[attributeKey],
        userId,
      );
    }

    // if all valid, process update
    return await this.registrationsService.updateRegistration(
      programId,
      referenceId,
      updateRegistrationDataDto,
    );
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
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'No user detectable from cookie or no cookie present',
  })
  @ApiQuery({
    name: 'phonenumber',
    required: true,
    type: 'string',
  })
  @Get('/registrations')
  public async searchRegistration(
    @Query('phonenumber') phonenumber: string,
    @Req() req,
  ) {
    const userId = req.user.id;
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
  @AuthenticatedUser({ permissions: [PermissionEnum.RegistrationFspUPDATE] })
  @ApiOperation({
    summary:
      '[SCOPED] [EXTERNALLY USED] Update chosen FSP and attributes. This will delete any custom data field related to the old FSP!',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Updated fsp and attributes - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
  })
  @ApiParam({ name: 'referenceId', required: true, type: 'string' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @Put('programs/:programId/registrations/:referenceId/fsp')
  public async updateChosenFsp(
    @Param() params,
    @Body() data: UpdateChosenFspDto,
    @Req() req,
  ) {
    const userId = req.user.id;
    return await this.registrationsService.updateChosenFsp({
      referenceId: params.referenceId,
      newFspName: data.newFspName,
      newFspAttributesRaw: data.newFspAttributes,
      userId,
    });
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
    @Req() req,
    @Param('programId') programId: number,
    @Query() queryParams, // Query decorator can be used in combi with Paginate decorator
  ): Promise<BulkActionResultDto> {
    const userId = req.user.id;
    await this.registrationsPaginateService.throwIfNoPermissionsForQuery(
      userId,
      programId,
      query,
    );

    const dryRun = queryParams.dryRun === 'true'; // defaults to false
    const result = await this.registrationsBulkService.deleteRegistrations(
      query,
      programId,
      dryRun,
    );

    if (dryRun) {
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
    @Req() req,
    @Param('programId', ParseIntPipe) programId: number,
    @Query() queryParams, // Query decorator can be used in combi with Paginate decorator
  ): Promise<BulkActionResultDto> {
    const userId = req.user.id;
    await this.registrationsPaginateService.throwIfNoPermissionsForQuery(
      userId,
      programId,
      query,
    );
    const dryRun = queryParams.dryRun === 'true'; // defaults to false
    if (!dryRun && body.skipMessageValidation) {
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
      dryRun,
    );

    if (dryRun) {
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
  @Get('programs/:programId/registrations/message-history/:referenceId')
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
  public async getReferenceId(@Param() params): Promise<any> {
    if (isNaN(params.paId)) {
      throw new HttpException('paId is not a number', HttpStatus.BAD_REQUEST);
    }

    return await this.registrationsService.getReferenceId(
      params.programId,
      params.paId,
    );
  }

  // Re-issue card: creates a new IntersolveVisa Child Wallet and Card for a Registration, and makes the old ones unusable. This endpoint needs data from Registration, which is why it is not in the IntersolveVisaController.
  // TODO: REFACTOR: Can we think of a better place for this endpoint? Or conceptually a better way to deal with re-issuing cards?
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
  // TODO: When a data structure has been created in the view cards task use that (or a subset).
  @HttpCode(HttpStatus.NO_CONTENT)
  public async reissueCardAndSendMessage(
    @Param('programId', ParseIntPipe) programId: number,
    @Param('referenceId') referenceId: string,
  ): Promise<any> {
    await this.registrationsService.reissueCardAndSendMessage(
      referenceId,
      programId,
    );
  }

  @ApiTags('financial-service-providers/intersolve-visa')
  @AuthenticatedUser({ permissions: [PermissionEnum.FspDebitCardBLOCK] })
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
  ) {
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
}
