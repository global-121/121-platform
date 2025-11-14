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
import {
  PaginateConfigRegistrationView,
  PaginateConfigRegistrationViewOnlyFilters,
} from '@121-service/src/registration/const/filter-operation.const';
import { BulkActionResultDto } from '@121-service/src/registration/dto/bulk-action-result.dto';
import {
  ImportRegistrationsDto,
  ImportResult,
} from '@121-service/src/registration/dto/bulk-import.dto';
import { CreateUniquesDto } from '@121-service/src/registration/dto/create-uniques.dto';
import { DeleteRegistrationsDto } from '@121-service/src/registration/dto/delete-registrations.dto';
import { DuplicateReponseDto } from '@121-service/src/registration/dto/duplicate-response.dto';
import { FindAllRegistrationsResultDto } from '@121-service/src/registration/dto/find-all-registrations-result.dto';
import { MappedPaginatedRegistrationDto } from '@121-service/src/registration/dto/mapped-paginated-registration.dto';
import { RegistrationStatusPatchDto } from '@121-service/src/registration/dto/registration-status-patch.dto';
import { SendCustomTextDto } from '@121-service/src/registration/dto/send-custom-text.dto';
import { UpdateRegistrationDto } from '@121-service/src/registration/dto/update-registration.dto';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { RegistrationViewEntity } from '@121-service/src/registration/entities/registration-view.entity';
import { GenericRegistrationAttributes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { RegistrationsService } from '@121-service/src/registration/services/registrations.service';
import { RegistrationsBulkService } from '@121-service/src/registration/services/registrations-bulk.service';
import { RegistrationsPaginationService } from '@121-service/src/registration/services/registrations-pagination.service';
import { AnyValidBody } from '@121-service/src/registration/validators/any-valid-body.validator';
import {
  FILE_UPLOAD_API_FORMAT,
  FILE_UPLOAD_WITH_REASON_API_FORMAT,
} from '@121-service/src/shared/file-upload-api-format';
import { ScopedUserRequest } from '@121-service/src/shared/scoped-user-request';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import { FinancialAttributes } from '@121-service/src/user/enum/registration-financial-attributes.const';
import { RequestHelper } from '@121-service/src/utils/request-helper/request-helper.helper';

@UseGuards(AuthenticatedUserGuard)
@Controller()
export class RegistrationsController {
  public constructor(
    private readonly registrationsService: RegistrationsService,
    private readonly registrationsPaginateService: RegistrationsPaginationService,
    private readonly registrationsBulkService: RegistrationsBulkService,
  ) {}

  @ApiTags('programs/registrations')
  @AuthenticatedUser({ permissions: [PermissionEnum.RegistrationCREATE] })
  @ApiOperation({
    summary: 'Import set of new PAs, from CSV',
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
    summary: '[EXTERNALLY USED] Import set of new PAs',
    description:
      'Use this endpoint to create new registrations in a specific program. Note that the attributes depend on the program configuration. Authenticate first using the /login endpoint.',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiBody({ isArray: true, type: ImportRegistrationsDto })
  @Post('programs/:programId/registrations')
  public async importRegistrationsJSON(
    @AnyValidBody(new ParseArrayPipe({ items: ImportRegistrationsDto })) // Registration can have dynamic attributes, so we cannot use whitelist
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
  @PaginatedSwaggerDocs(RegistrationViewEntity, PaginateConfigRegistrationView)
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

    await this.registrationsPaginateService.throwIfNoPersonalReadPermission(
      userId,
      programId,
      query,
    );

    return await this.registrationsPaginateService.getPaginate({
      query,
      programId: Number(programId),
      hasPersonalReadPermission: hasPersonalRead,
      noLimit: false,
    });
  }

  @AuthenticatedUser({
    permissions: [PermissionEnum.RegistrationBulkUPDATE],
  })
  @ApiTags('programs/registrations')
  @ApiOperation({
    summary: `Bulk update registration using a CSV file. The columns in the CSV file should contain at least referenceId and the columns you want to update. If you leave a cell empty the corresponding registration data will be update with an empty string. Max file length is 100k rows. We do not support updating phone numbers or referenceId.`,
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @Patch('programs/:programId/registrations')
  @ApiConsumes('multipart/form-data')
  @ApiBody(FILE_UPLOAD_WITH_REASON_API_FORMAT)
  @UseInterceptors(FileInterceptor('file'))
  public async patchRegistrations(
    @UploadedFile() csvFile: Express.Multer.File,
    @AnyValidBody('reason') reason: string, // Registration can have dynamic attributes, so we cannot use whitelist
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
      'The registration status update was successfully started - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
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

    await this.registrationsPaginateService.throwIfNoPersonalReadPermission(
      userId,
      programId,
      query,
    );
    const dryRunBoolean = dryRun === 'true'; // defaults to false
    const result =
      await this.registrationsBulkService.updateRegistrationStatusOrDryRun({
        paginateQuery: query,
        programId,
        registrationStatus: registrationStatus as RegistrationStatusEnum,
        dryRun: dryRunBoolean,
        userId,
        messageContentDetails: {
          message: statusUpdateDto.message,
          messageTemplateKey: statusUpdateDto.messageTemplateKey,
          messageContentType,
        },
        reason: statusUpdateDto.reason,
      });
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
    @AnyValidBody() updateRegistrationDto: UpdateRegistrationDto, // Registration can have dynamic attributes, so we cannot use whitelist
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
        GenericRegistrationAttributes.programFspConfigurationName
      ) {
        if (!hasUpdateFspConfigPermission) {
          const errors = `User does not have permission to update chosen program Fsp configuration`;
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
      'Deleting set of registrations was successfully started - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
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
    @Body() body: DeleteRegistrationsDto,
    @Query('dryRun') dryRun = 'false', // Query decorator can be used in combination with Paginate decorator
  ): Promise<BulkActionResultDto> {
    const userId = RequestHelper.getUserId(req);

    await this.registrationsPaginateService.throwIfNoPersonalReadPermission(
      userId,
      programId,
      query,
    );

    const dryRunBoolean = dryRun === 'true'; // defaults to false
    const result = await this.registrationsBulkService.deleteRegistrations({
      paginateQuery: query,
      programId,
      dryRun: dryRunBoolean,
      reason: body.reason,
    });

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
      'Sending bulk message was successfully started - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
    type: BulkActionResultDto,
  })
  @ApiOperation({
    summary:
      '[SCOPED] Sends custom message via SMS or WhatsApp to set of PAs that can be defined via filter parameters.',
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
    @Query('dryRun') dryRun = 'false', // Query decorator can be used in combination with Paginate decorator
  ): Promise<BulkActionResultDto> {
    const userId = RequestHelper.getUserId(req);

    await this.registrationsPaginateService.throwIfNoPersonalReadPermission(
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
    const result = await this.registrationsBulkService.sendMessagesOrDryRun(
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
  @AuthenticatedUser({ permissions: [PermissionEnum.RegistrationPersonalREAD] })
  @ApiOperation({
    summary: '[SCOPED] Gets duplicate registrations for a registration',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({ name: 'referenceId', required: true, type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: `Returns duplicate registrations for a registration. NOTE: this endpoint is scoped, it is only possible to request duplicates for a registration that the logged in user has access to. For the duplicate registrations that are returned the "name" property is only visisble for registrations in the user's scope.`,
    type: DuplicateReponseDto,
    isArray: true,
  })
  @Get('programs/:programId/registrations/:referenceId/duplicates')
  public async getDuplicates(
    @Param('referenceId') referenceId: string, // TODO: change to registrationId; for now we use referenceId as else a lot of helper code needs to be duplicated to start using registrationId in these controllers
    @Param('programId', ParseIntPipe)
    programId: number,
  ): Promise<DuplicateReponseDto[]> {
    return await this.registrationsService.getDuplicates(
      referenceId,
      programId,
    );
  }

  @AuthenticatedUser({
    permissions: [
      PermissionEnum.RegistrationPersonalUPDATE,
      PermissionEnum.RegistrationDuplicationDELETE,
    ],
  })
  @ApiOperation({
    summary:
      'Post an array of registrationIds that are marked as unique to each other. This means that in duplicate checks these registrations will not be checked for being duplicate with each other.',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Registration marked as unique to each other',
  })
  @Post('programs/:programId/registrations/uniques')
  public async createUniques(
    @Param('programId', ParseIntPipe) programId: number,
    @Body() body: CreateUniquesDto,
  ): Promise<void> {
    return await this.registrationsService.createUniques({
      registrationIds: body.registrationIds,
      programId,
      reason: body.reason,
    });
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
