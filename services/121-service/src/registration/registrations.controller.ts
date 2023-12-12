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
  Put,
  Query,
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
  ApiProperty,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import {
  Paginate,
  Paginated,
  PaginatedSwaggerDocs,
  PaginateQuery,
} from 'nestjs-paginate';
import { FspAnswersAttrInterface } from '../fsp/fsp-interface';
import { Permissions } from '../guards/permissions.decorator';
import { PermissionsGuard } from '../guards/permissions.guard';
import { PersonAffectedAuth } from '../guards/person-affected-auth.decorator';
import { PersonAffectedAuthGuard } from '../guards/person-affected-auth.guard';
import { MessageContentType } from '../notifications/enum/message-type.enum';
import { FILE_UPLOAD_API_FORMAT } from '../shared/file-upload-api-format';
import { PermissionEnum } from '../user/permission.enum';
import { User } from '../user/user.decorator';
import {
  PaginateConfigRegistrationViewOnlyFilters,
  PaginateConfigRegistrationViewWithPayments,
} from './const/filter-operation.const';
import { BulkActionResultDto } from './dto/bulk-action-result.dto';
import { ImportRegistrationsDto, ImportResult } from './dto/bulk-import.dto';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { CustomDataDto } from './dto/custom-data.dto';
import { DownloadData } from './dto/download-data.interface';
import { MessageHistoryDto } from './dto/message-history.dto';
import { ReferenceIdDto } from './dto/reference-id.dto';
import { RegistrationStatusPatchDto } from './dto/registration-status-patch.dto';
import { SendCustomTextDto } from './dto/send-custom-text.dto';
import { SetFspDto, UpdateChosenFspDto } from './dto/set-fsp.dto';
import { SetPhoneRequestDto } from './dto/set-phone-request.dto';
import {
  UpdateAttributeDto,
  UpdateRegistrationDto,
} from './dto/update-registration.dto';
import { ValidationIssueDataDto } from './dto/validation-issue-data.dto';
import { RegistrationStatusEnum } from './enum/registration-status.enum';
import { RegistrationStatusChangeEntity } from './registration-status-change.entity';
import { RegistrationViewEntity } from './registration-view.entity';
import { RegistrationEntity } from './registration.entity';
import { RegistrationsService } from './registrations.service';
import { RegistrationsBulkService } from './services/registrations-bulk.service';
import { RegistrationsPaginationService } from './services/registrations-pagination.service';
import Api from 'twilio/lib/rest/Api';

export class FileUploadDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  public file: any;
}
@UseGuards(PermissionsGuard, PersonAffectedAuthGuard)
@Controller()
export class RegistrationsController {
  public constructor(
    private readonly registrationsService: RegistrationsService,
    private readonly registrationsPaginateService: RegistrationsPaginationService,
    private readonly registrationsBulkService: RegistrationsBulkService,
  ) {}

  @ApiTags('programs/registrations')
  @ApiOperation({ summary: 'Create registration' })
  @ApiResponse({ status: 201, description: 'Created registration' })
  @ApiResponse({
    status: 401,
    description: 'No user detectable from cookie or no cookie present',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @Post('programs/:programId/registrations')
  public async create(
    @Body() createRegistrationDto: CreateRegistrationDto,
    @Param('programId') programId,
    @User('id') userId: number,
  ): Promise<RegistrationEntity> {
    if (!userId) {
      const errors = `No user detectable from cookie or no cookie present'`;
      throw new HttpException({ errors }, HttpStatus.UNAUTHORIZED);
    }
    return await this.registrationsService.create(
      createRegistrationDto,
      Number(programId),
      userId,
    );
  }

  @ApiTags('programs/registrations')
  @PersonAffectedAuth()
  @ApiOperation({ summary: 'Set Financial Service Provider (FSP)' })
  @ApiResponse({ status: 201 })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @Post('programs/:programId/registrations/fsp')
  public async addFsp(@Body() setFsp: SetFspDto): Promise<RegistrationEntity> {
    return await this.registrationsService.addFsp(
      setFsp.referenceId,
      setFsp.fspId,
    );
  }

  @ApiTags('programs/registrations')
  @PersonAffectedAuth()
  @ApiOperation({
    summary: 'Set custom data for registration (Used by Person Affected)',
  })
  @ApiResponse({
    status: 201,
    description: 'Custom data set for registration',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @Post('programs/:programId/registrations/custom-data')
  public async addCustomData(
    @Body(new ParseArrayPipe({ items: CustomDataDto }))
    customDataArray: CustomDataDto[],
  ): Promise<RegistrationEntity[]> {
    return await this.registrationsService.addRegistrationDataBulk(
      customDataArray,
    );
  }

  @ApiTags('programs/registrations')
  @PersonAffectedAuth()
  @ApiOperation({ summary: 'Set phone number' })
  @ApiResponse({ status: 201, description: 'Phone set for registration' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @Post('programs/:programId/registrations/phone')
  public async addPhone(
    @Body() setPhoneRequest: SetPhoneRequestDto,
  ): Promise<void> {
    return await this.registrationsService.addPhone(
      setPhoneRequest.referenceId,
      setPhoneRequest.phonenumber,
      setPhoneRequest.language,
      setPhoneRequest.useForInvitationMatching,
    );
  }

  @ApiTags('programs/registrations')
  @PersonAffectedAuth()
  @ApiOperation({
    summary:
      'Person Affected switches from started registration to registered for program',
  })
  @ApiResponse({
    status: 201,
    description:
      'Person Affected switched from started registration to registered for program',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @Post('programs/:programId/registrations/register')
  public async register(
    @Body() referenceIdDto: ReferenceIdDto,
  ): Promise<ReferenceIdDto | boolean> {
    return await this.registrationsService.register(referenceIdDto.referenceId);
  }

  @ApiTags('programs/registrations')
  @Permissions(PermissionEnum.RegistrationCREATE)
  @ApiOperation({
    summary: 'Import set of PAs to invite, based on CSV',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @Post('programs/:programId/registrations/import-bulk')
  @ApiConsumes('multipart/form-data')
  @ApiBody(FILE_UPLOAD_API_FORMAT)
  @UseInterceptors(FileInterceptor('file'))
  public async importBulkAsImported(
    @UploadedFile() csvFile,
    @Param() params,
    @User('id') userId: number,
  ): Promise<ImportResult> {
    return await this.registrationsService.importBulkAsImported(
      csvFile,
      Number(params.programId),
      userId,
    );
  }

  @ApiTags('programs/registrations')
  @Permissions(PermissionEnum.RegistrationImportTemplateREAD)
  @ApiOperation({
    summary: 'Get a CSV template for importing registrations',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({ name: 'type', required: true, type: 'string' })
  @Get('programs/:programId/registrations/import-template/:type')
  public async getImportRegistrationsTemplate(
    @Param() params,
  ): Promise<string[]> {
    return await this.registrationsService.getImportRegistrationsTemplate(
      Number(params.programId),
      params.type,
    );
  }

  @ApiTags('programs/registrations')
  @Permissions(PermissionEnum.RegistrationCREATE)
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
    @Param() params,
    @User('id') userId: number,
  ): Promise<ImportResult> {
    return await this.registrationsService.importRegistrations(
      csvFile,
      Number(params.programId),
      userId,
    );
  }

  @ApiTags('programs/registrations')
  @Permissions(PermissionEnum.RegistrationCREATE)
  @ApiOperation({
    summary: 'Import set of registered PAs',
    description:
      'Use this endpoint to create new registrations in a specific program. Note that the attributes depend on the program configuration. Authenticate first using the /login endpoint.',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiBody({ isArray: true, type: ImportRegistrationsDto })
  @Post('programs/:programId/registrations/import')
  public async importRegistrationsJSON(
    @Body(new ParseArrayPipe({ items: ImportRegistrationsDto }))
    data: ImportRegistrationsDto[],
    @Param() params,
    @Query() queryParams,
    @User('id') userId: number,
  ): Promise<ImportResult> {
    const validation = !queryParams.validation ?? true;
    if (validation) {
      const validatedData =
        await this.registrationsService.importJsonValidateRegistrations(
          data,
          Number(params.programId),
          userId,
        );
      return await this.registrationsService.importValidatedRegistrations(
        validatedData,
        Number(params.programId),
      );
    } else {
      return await this.registrationsService.importValidatedRegistrations(
        data,
        Number(params.programId),
      );
    }
  }

  @ApiTags('programs/registrations')
  @Permissions(PermissionEnum.RegistrationREAD)
  @ApiOperation({
    summary:
      '(SCOPED) Get paginated registrations. Below you will find all the default paginate options, including filtering on any generic fields. NOTE: additionally you can filter on program-specific fields, like program questions, fsp questions, and custom attributes, even though not specified in the Swagger Docs.',
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
    @User('id') userId: number,
    @Param('programId', ParseIntPipe) programId: number,
  ): Promise<Paginated<RegistrationViewEntity>> {
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

  @ApiTags('programs/registrations')
  @ApiResponse({
    status: 200,
    description:
      'Dry run result for the registration status update - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
    type: BulkActionResultDto,
  })
  @ApiResponse({
    status: 202,
    description:
      'The registration status update was succesfully started - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
    type: BulkActionResultDto,
  })
  @ApiOperation({
    summary:
      '(SCOPED) Update registration status of set of PAs that can be defined via filter parameters.',
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
    description:
      'When this parameter is set to `true`, the function will simulate the execution of the process without actually making any changes, so no registration statuses will be updated or messages will be sent.  Instead it will return data on how many registrations this action can be applied to. If this parameter is not included or is set to `false`, the function will execute normally. In both cases the response will be the same.',
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
    @User('id') userId: number,
    @Param('programId', ParseIntPipe) programId: number,
    @Query() queryParams, // Query decorator can be used in combi with Paginate decorator
  ): Promise<BulkActionResultDto> {
    let permission: PermissionEnum;
    let messageContentType: MessageContentType;
    const registrationStatus = statusUpdateDto.status;
    switch (registrationStatus) {
      case RegistrationStatusEnum.included:
        permission = PermissionEnum.RegistrationStatusIncludedUPDATE;
        messageContentType = MessageContentType.included;
        break;
      case RegistrationStatusEnum.rejected:
        permission = PermissionEnum.RegistrationStatusRejectedUPDATE;
        messageContentType = MessageContentType.rejected;
        break;
      case RegistrationStatusEnum.inclusionEnded:
        permission = PermissionEnum.RegistrationStatusInclusionEndedUPDATE;
        messageContentType = MessageContentType.inclusionEnded;
        break;
      case RegistrationStatusEnum.paused:
        permission = PermissionEnum.RegistrationStatusPausedUPDATE;
        messageContentType = MessageContentType.paused;
        break;
      case RegistrationStatusEnum.invited:
        permission = PermissionEnum.RegistrationStatusInvitedUPDATE;
        messageContentType = MessageContentType.invited;
        break;
      case RegistrationStatusEnum.selectedForValidation:
        permission =
          PermissionEnum.RegistrationStatusSelectedForValidationUPDATE;
        break;
      case RegistrationStatusEnum.noLongerEligible:
        permission = PermissionEnum.RegistrationStatusNoLongerEligibleUPDATE;
        break;
    }
    if (!permission) {
      const errors = `The status ${registrationStatus} is unknown or cannot be changed to via API`;
      throw new HttpException({ errors }, HttpStatus.BAD_REQUEST);
    }
    const hasPermission =
      await this.registrationsPaginateService.userHasPermissionForProgram(
        userId,
        programId,
        permission,
      );
    if (!hasPermission) {
      const errors = `User does not have permission to update registration status to included`;
      throw new HttpException({ errors }, HttpStatus.UNAUTHORIZED);
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

  @ApiTags('programs/registrations')
  @Permissions(PermissionEnum.RegistrationAttributeUPDATE)
  @ApiOperation({
    summary:
      '(SCOPED) Update provided attributes of registration (Used by Aidworker)',
  })
  @ApiResponse({
    status: 200,
    description:
      'Updated provided attributes of registration - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({ name: 'referenceId', required: true, type: 'string' })
  //Note: this endpoint must be placed below /programs/:programId/registrations/status to avoid conflict
  @Patch('programs/:programId/registrations/:referenceId')
  public async updateRegistration(
    @Param() params,
    @Body() updateRegistrationDataDto: UpdateRegistrationDto,
    @User('id') userId: number,
  ): Promise<RegistrationEntity> {
    const partialRegistration = updateRegistrationDataDto.data;
    // first validate all attributes and return error if any
    for (const attributeKey of Object.keys(partialRegistration)) {
      const attributeDto: UpdateAttributeDto = {
        referenceId: params.referenceId,
        attribute: attributeKey,
        value: partialRegistration[attributeKey],
      };
      const errors = await validate(
        plainToClass(UpdateAttributeDto, attributeDto),
      );
      if (errors.length > 0) {
        throw new HttpException({ errors }, HttpStatus.BAD_REQUEST);
      }
    }

    // if all valid, process update
    return await this.registrationsService.updateRegistration(
      params.programId,
      params.referenceId,
      updateRegistrationDataDto,
      userId,
    );
  }

  @ApiTags('registrations')
  // There's no permission check here because there's a check included in the queries done to fetch data.
  @ApiOperation({
    summary:
      '(SCOPED) Find registration by phone-number for Redline integration and FieldValidation',
  })
  @ApiResponse({
    status: 200,
    description:
      'Return registrations that match the exact phone-number - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
  })
  @ApiResponse({
    status: 401,
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
    @User('id') userId: number,
  ): Promise<RegistrationViewEntity[]> {
    if (!userId) {
      const errors = `No user detectable from cookie or no cookie present'`;
      throw new HttpException({ errors }, HttpStatus.UNAUTHORIZED);
    }
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
  @Permissions(PermissionEnum.RegistrationFspUPDATE)
  @ApiOperation({
    summary:
      '(SCOPED) Update chosen FSP and attributes. This will delete any custom data field related to the old FSP!',
  })
  @ApiResponse({
    status: 201,
    description:
      'Updated fsp and attributes - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
  })
  @ApiParam({ name: 'referenceId', required: true, type: 'string' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @Put('programs/:programId/registrations/:referenceId/fsp')
  public async updateChosenFsp(
    @Param() params,
    @Body() data: UpdateChosenFspDto,
  ): Promise<RegistrationEntity> {
    return await this.registrationsService.updateChosenFsp(
      params.referenceId,
      data.newFspName,
      data.newFspAttributes,
    );
  }

  @ApiTags('programs/registrations')
  @ApiResponse({
    status: 200,
    description:
      'Dry run result for deleting set of registrations - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
    type: BulkActionResultDto,
  })
  @ApiResponse({
    status: 202,
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
    description:
      'When this parameter is set to `true`, the function will simulate the execution of the process without actually making any changes, so no registrations will be deleted. Instead it will return data on how many PAs this action can be applied to. If this parameter is not included or is set to `false`, the function will execute normally. In both cases the response will be the same.',
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
  @Permissions(PermissionEnum.RegistrationDELETE)
  @ApiOperation({ summary: '(SCOPED) Delete set of registrations' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @Delete('programs/:programId/registrations')
  public async delete(
    @Paginate() query: PaginateQuery,
    @User('id') userId: number,
    @Param('programId') programId: number,
    @Query() queryParams, // Query decorator can be used in combi with Paginate decorator
  ): Promise<BulkActionResultDto> {
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

  @ApiTags('registrations')
  // There's no permission check here because there's a check included in the queries done to fetch data.
  @ApiOperation({
    summary: '(SCOPED) Download all program answers (for validation)',
  })
  @ApiResponse({
    status: 200,
    description:
      'Program answers downloaded - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
  })
  @ApiResponse({
    status: 401,
    description: 'No user detectable from cookie or no cookie present',
  })
  @Get('registrations/download/validation-data')
  public async downloadValidationData(
    @User('id') userId: number,
  ): Promise<DownloadData> {
    if (!userId) {
      const errors = `No user detectable from cookie or no cookie present'`;
      throw new HttpException({ errors }, HttpStatus.UNAUTHORIZED);
    }
    return await this.registrationsService.downloadValidationData(userId);
  }

  @ApiTags('registrations')
  // There's no permission check here because there's a check included in the queries done to fetch data.
  @ApiOperation({
    summary: 'Get registration with prefilled answers (for AW)',
  })
  @ApiResponse({ status: 200, description: 'Got registrations' })
  @ApiResponse({
    status: 401,
    description: 'No user detectable from cookie or no cookie present',
  })
  @ApiParam({
    name: 'referenceId',
  })
  @Get('registrations/:referenceId')
  public async getRegistration(
    @Param() params,
    @User('id') userId: number,
  ): Promise<RegistrationEntity> {
    if (!userId) {
      const errors = `No user detectable from cookie or no cookie present'`;
      throw new HttpException({ errors }, HttpStatus.UNAUTHORIZED);
    }
    return await this.registrationsService.getRegistrationToValidate(
      params.referenceId,
      userId,
    );
  }

  @ApiTags('programs/registrations')
  @Permissions(PermissionEnum.RegistrationFspREAD)
  @ApiOperation({ summary: '(SCOPED) Get FSP-attribute answers' })
  @ApiResponse({
    status: 200,
    description:
      'Retrieved FSP-attribute answers - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiQuery({ name: 'referenceId', required: true, type: 'string' })
  @Get('programs/:programId/registrations/fsp-attributes')
  public async getFspAnswersAttributes(
    @Query() queryParams: ReferenceIdDto,
  ): Promise<FspAnswersAttrInterface> {
    return await this.registrationsService.getFspAnswersAttributes(
      queryParams.referenceId,
    );
  }

  @ApiTags('programs/registrations')
  @Permissions(PermissionEnum.RegistrationPersonalUPDATE)
  @ApiOperation({ summary: '(SCOPED) Issue validationData (For AW)' })
  @ApiResponse({
    status: 200,
    description:
      'Validation Data issued - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @Post('programs/:programId/registrations/issue-validation')
  public async issue(
    @Body() validationIssueData: ValidationIssueDataDto,
    @Param('programId') programId,
    @User('id') userId: number,
  ): Promise<void> {
    return await this.registrationsService.issueValidation(
      validationIssueData,
      programId,
      userId,
    );
  }

  @ApiTags('programs/registrations')
  @ApiResponse({
    status: 200,
    description:
      'Dry run result for sending a bulk message - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
    type: BulkActionResultDto,
  })
  @ApiResponse({
    status: 202,
    description:
      'Sending bulk message was succesfully started - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
    type: BulkActionResultDto,
  })
  @ApiOperation({
    summary:
      '(SCOPED) Sends custom message via sms or whatsapp to set of PAs that can be defined via filter parameters.',
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
    description:
      'When this parameter is set to `true`, the function will simulate the execution of the process without actually making any changes, so no messages will be sent. Instead it will return data on how many PAs this action can be applied to. If this parameter is not included or is set to `false`, the function will execute normally. In both cases the response will be the same.',
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
  @Permissions(PermissionEnum.RegistrationNotificationCREATE)
  @Post('programs/:programId/registrations/message')
  public async sendCustomTextMessage(
    @Body() body: SendCustomTextDto,
    @Paginate() query: PaginateQuery,
    @User('id') userId: number,
    @Param('programId', ParseIntPipe) programId: number,
    @Query() queryParams, // Query decorator can be used in combi with Paginate decorator
  ): Promise<BulkActionResultDto> {
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
  @Permissions(PermissionEnum.RegistrationNotificationREAD)
  @ApiOperation({
    summary: '(SCOPED) Get message history for one registration',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiResponse({
    status: 200,
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
  @PersonAffectedAuth()
  @ApiOperation({
    summary: 'Get registration status. Used by person affected only',
  })
  @ApiResponse({
    status: 200,
    description:
      'Registration status retrieved  - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({ name: 'referenceId', required: true, type: 'string' })
  @Get('programs/:programId/registrations/status/:referenceId')
  public async getRegistrationStatus(@Param() params): Promise<any> {
    const status = await this.registrationsService.getRegistrationStatus(
      params.referenceId,
    );

    return { status };
  }

  @ApiTags('programs/registrations')
  @Permissions(PermissionEnum.RegistrationREAD)
  @ApiOperation({ summary: '(SCOPED) Get Person Affected referenceId' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({ name: 'paId', required: true, type: 'integer' })
  @ApiResponse({
    status: 200,
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

  @ApiTags('programs/registrations')
  @Permissions(PermissionEnum.RegistrationREAD)
  @ApiOperation({ summary: '(SCOPED) Get registration status changes' })
  @ApiResponse({
    status: 200,
    description:
      'Registration status changes retrieved - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({ name: 'referenceId', required: true, type: 'string' })
  @Get('programs/:programId/registrations/status-changes/:referenceId')
  public async getRegistrationStatusChanges(
    @Param() params,
  ): Promise<RegistrationStatusChangeEntity[]> {
    return await this.registrationsService.getRegistrationStatusChanges(
      params.programId,
      params.referenceId,
    );
  }
}
