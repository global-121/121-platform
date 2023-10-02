import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  ParseArrayPipe,
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
import { PaginateConfigRegistrationViewWithPayments } from './const/filter-operation.const';
import { ImportRegistrationsDto, ImportResult } from './dto/bulk-import.dto';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { CustomDataDto } from './dto/custom-data.dto';
import { DownloadData } from './dto/download-data.interface';
import { MessageHistoryDto } from './dto/message-history.dto';
import { NoteDto, UpdateNoteDto } from './dto/note.dto';
import { ReferenceIdDto, ReferenceIdsDto } from './dto/reference-id.dto';
import { RegistrationResponse } from './dto/registration-response.model';
import { RegistrationStatusPatchResultDto } from './dto/registration-status-patch-result.dto';
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
import { RegistrationViewEntity } from './registration-view.entity';
import { RegistrationEntity } from './registration.entity';
import { RegistrationsService } from './registrations.service';
import { RegistrationsPaginationService } from './services/registrations-pagination.service';

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
  @ApiOperation({ summary: 'Import set of PAs to invite, based on CSV' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @Post('programs/:programId/registrations/import-bulk')
  @ApiConsumes('multipart/form-data')
  @ApiBody(FILE_UPLOAD_API_FORMAT)
  @UseInterceptors(FileInterceptor('file'))
  public async importBulk(
    @UploadedFile() csvFile,
    @Param() params,
    @User('id') userId: number,
  ): Promise<ImportResult> {
    return await this.registrationsService.importBulk(
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
  ): Promise<ImportResult> {
    return await this.registrationsService.importRegistrations(
      csvFile,
      Number(params.programId),
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
  ): Promise<ImportResult> {
    const validation = !queryParams.validation ?? true;
    if (validation) {
      const validatedData =
        await this.registrationsService.importJsonValidateRegistrations(
          data,
          Number(params.programId),
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
      'Get paginated registrations. Below you will find all the default paginate options, including filtering on any generic fields. NOTE: additionally you can filter on program-specific fields, like program questions, fsp questions, and custom attributes, even though not specified in the Swagger Docs.',
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
    @Param('programId') programId: number,
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
    );
  }

  @Permissions(PermissionEnum.RegistrationREAD)
  @ApiOperation({
    summary: 'Get all registrations for program',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiQuery({ name: 'personalData', required: true, type: 'boolean' })
  @ApiQuery({ name: 'paymentData', required: true, type: 'boolean' })
  @ApiQuery({ name: 'referenceId', required: false, type: 'string' })
  @ApiQuery({ name: 'filterOnPayment', required: false, type: 'number' })
  @ApiQuery({ name: 'attributes', required: false, type: 'string' })
  @ApiResponse({
    status: 201,
    description: 'Got all People Affected for program EXCLUDING personal data',
  })
  @Get('programs/:programId/registrations/old')
  public async getPeopleAffected(
    @Param('programId') programId: number,
    @User('id') userId: number,
    @Query() queryParams,
  ): Promise<any[]> {
    const personalData = queryParams.personalData === 'true';
    const paymentData = queryParams.paymentData === 'true';
    if (personalData) {
      await this.registrationsService.checkPermissionAndThrow(
        userId,
        PermissionEnum.RegistrationPersonalREAD,
        Number(programId),
      );
    }
    if (paymentData || queryParams.filterOnPayment) {
      await this.registrationsService.checkPermissionAndThrow(
        userId,
        PermissionEnum.PaymentTransactionREAD,
        Number(programId),
      );
    }

    let attributes: [];
    if (queryParams.attributes || queryParams.attributes === '') {
      attributes =
        queryParams.attributes === '' ? [] : queryParams.attributes.split(',');
    }

    return await this.registrationsService.getRegistrations(
      Number(programId),
      personalData,
      paymentData,
      true,
      queryParams.referenceId,
      queryParams.filterOnPayment,
      attributes,
    );
  }

  @ApiTags('programs/registrations')
  @Permissions(PermissionEnum.RegistrationAttributeUPDATE)
  @ApiOperation({
    summary: 'Update provided attributes of registration (Used by Aidworker)',
  })
  @ApiResponse({
    status: 201,
    description: 'Updated provided attributes of registration',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({ name: 'referenceId', required: true, type: 'string' })
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

  @ApiTags('programs/registrations')
  @Permissions(PermissionEnum.RegistrationPersonalUPDATE)
  @ApiOperation({ summary: 'Update note for registration' })
  @ApiResponse({ status: 201, description: 'Update note for registration' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @Post('programs/:programId/registrations/note')
  public async updateNote(@Body() updateNote: UpdateNoteDto): Promise<NoteDto> {
    return await this.registrationsService.updateNote(
      updateNote.referenceId,
      updateNote.note,
    );
  }

  @ApiTags('programs/registrations')
  @Permissions(PermissionEnum.RegistrationPersonalREAD)
  @ApiOperation({ summary: 'Get note for registration' })
  @ApiResponse({ status: 200, description: 'Get note for registration' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({ name: 'referenceId', required: true })
  @Get('programs/:programId/registrations/note/:referenceId')
  public async retrieveNote(@Param() params): Promise<NoteDto> {
    return await this.registrationsService.retrieveNote(params.referenceId);
  }

  @ApiTags('programs/registrations')
  @ApiOperation({ summary: 'Update registration status of set of PAs.' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @Patch('programs/:programId/registrations')
  public async patchRegistrationsStatus(
    @Paginate() query: PaginateQuery,
    @Body() statusUpdateDto: RegistrationStatusPatchDto,
    @User('id') userId: number,
    @Param('programId') programId: number,
  ): Promise<RegistrationStatusPatchResultDto> {
    let permission: PermissionEnum;
    let messageContentType: MessageContentType;
    const registrationStatus = statusUpdateDto.status;
    switch (registrationStatus) {
      case RegistrationStatusEnum.included:
        permission = PermissionEnum.RegistrationStatusIncludedUPDATE;
        messageContentType = MessageContentType.included;
      case RegistrationStatusEnum.rejected:
        permission = PermissionEnum.RegistrationStatusRejectedUPDATE;
        messageContentType = MessageContentType.rejected;
      case RegistrationStatusEnum.inclusionEnded:
        permission = PermissionEnum.RegistrationStatusInclusionEndedUPDATE;
        messageContentType = MessageContentType.inclusionEnded;
      case RegistrationStatusEnum.paused:
        permission = PermissionEnum.RegistrationStatusPausedUPDATE;
        messageContentType = MessageContentType.paused;
      case RegistrationStatusEnum.invited:
        permission = PermissionEnum.RegistrationStatusInvitedUPDATE;
        messageContentType = MessageContentType.invited;
      case RegistrationStatusEnum.selectedForValidation:
        permission =
          PermissionEnum.RegistrationStatusSelectedForValidationUPDATE;
      case RegistrationStatusEnum.noLongerEligible:
        permission = PermissionEnum.RegistrationStatusNoLongerEligibleUPDATE;
    }
    if (!permission) {
      const errors = `Unknown status ${registrationStatus}`;
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

    return await this.registrationsService.patchRegistrationsStatus(
      query,
      programId,
      registrationStatus as RegistrationStatusEnum,
      statusUpdateDto.message,
      messageContentType,
    );
  }

  @ApiTags('registrations')
  // There's no permission check here because there's a check included in the queries done to fetch data.
  @ApiOperation({
    summary:
      'Find registration by phone-number for Redline integration and FieldValidation',
  })
  @ApiResponse({
    status: 200,
    description: 'Return registrations that match the exact phone-number',
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
  ): Promise<RegistrationResponse[]> {
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
      'Update chosen FSP and attributes. This will delete any custom data field related to the old FSP!',
  })
  @ApiResponse({
    status: 201,
    description: 'Updated fsp and attributes',
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
  @Permissions(PermissionEnum.RegistrationDELETE)
  @ApiOperation({ summary: 'Delete set of registrations' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @Delete('programs/:programId/registrations')
  public async delete(
    @Body() referenceIdsData: ReferenceIdsDto,
  ): Promise<void> {
    await this.registrationsService.deleteBatch(referenceIdsData);
  }

  @ApiTags('programs/registrations')
  @Permissions(PermissionEnum.RegistrationDELETE)
  @ApiOperation({ summary: 'Delete set of registrations' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @Post('programs/:programId/registrations/delete')
  public async deletePost(
    @Body() referenceIdsData: ReferenceIdsDto,
  ): Promise<void> {
    await this.registrationsService.deleteBatch(referenceIdsData);
  }

  @ApiTags('registrations')
  // There's no permission check here because there's a check included in the queries done to fetch data.
  @ApiOperation({ summary: 'Download all program answers (for validation)' })
  @ApiResponse({ status: 200, description: 'Program answers downloaded' })
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
  @Get('registrations/get/:referenceId')
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
  @ApiOperation({ summary: 'Find FSP and attributes' })
  @ApiResponse({
    status: 201,
    description: 'Found fsp and attributes',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @Post('programs/:programId/registrations/get-fsp')
  public async getFspAnswersAttributes(
    @Body() referenceIdDto: ReferenceIdDto,
  ): Promise<FspAnswersAttrInterface> {
    return await this.registrationsService.getFspAnswersAttributes(
      referenceIdDto.referenceId,
    );
  }

  @ApiTags('programs/registrations')
  @Permissions(PermissionEnum.RegistrationPersonalUPDATE)
  @ApiOperation({ summary: 'Issue validationData (For AW)' })
  @ApiResponse({ status: 200, description: 'Validation Data issued' })
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
  @Permissions(PermissionEnum.RegistrationNotificationCREATE)
  @ApiOperation({
    summary:
      'Send custom text-message (whatsapp or sms) to array of registrations',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @Post('programs/:programId/registrations/text-message')
  public async sendCustomTextMessage(
    @Body() data: SendCustomTextDto,
  ): Promise<void> {
    return await this.registrationsService.sendCustomTextMessage(
      data.referenceIds,
      data.message,
    );
  }

  @ApiTags('programs/registrations')
  @Permissions(PermissionEnum.RegistrationNotificationREAD)
  @ApiOperation({ summary: 'Get message history for one registration' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
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
  @ApiOperation({ summary: 'Get registration status' })
  @ApiResponse({ status: 200 })
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
  @ApiOperation({ summary: 'Get Person Affected referenceId' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({ name: 'paId', required: true, type: 'integer' })
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
}
