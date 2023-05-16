import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  ParseArrayPipe,
  Post,
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
import { FspAnswersAttrInterface } from '../fsp/fsp-interface';
import { Permissions } from '../guards/permissions.decorator';
import { PermissionsGuard } from '../guards/permissions.guard';
import { PersonAffectedAuth } from '../guards/person-affected-auth.decorator';
import { PersonAffectedAuthGuard } from '../guards/person-affected-auth.guard';
import { MessageContentType } from '../notifications/message-type.enum';
import { FILE_UPLOAD_API_FORMAT } from '../shared/file-upload-api-format';
import { PermissionEnum } from '../user/permission.enum';
import { User } from '../user/user.decorator';
import { ImportRegistrationsDto, ImportResult } from './dto/bulk-import.dto';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { CustomDataDto } from './dto/custom-data.dto';
import { DownloadData } from './dto/download-data.interface';
import { MessageHistoryDto } from './dto/message-history.dto';
import { MessageDto } from './dto/message.dto';
import { NoteDto, UpdateNoteDto } from './dto/note.dto';
import { ReferenceIdDto, ReferenceIdsDto } from './dto/reference-id.dto';
import { RegistrationResponse } from './dto/registration-response.model';
import { SendCustomTextDto } from './dto/send-custom-text.dto';
import { SetFspDto, UpdateChosenFspDto } from './dto/set-fsp.dto';
import { SetPhoneRequestDto } from './dto/set-phone-request.dto';
import { UpdateAttributeDto } from './dto/update-attribute.dto';
import { ValidationIssueDataDto } from './dto/validation-issue-data.dto';
import { RegistrationStatusEnum } from './enum/registration-status.enum';
import { RegistrationEntity } from './registration.entity';
import { RegistrationsService } from './registrations.service';

export class FileUploadDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  public file: any;
}
@UseGuards(PermissionsGuard, PersonAffectedAuthGuard)
@ApiTags('registrations')
@Controller()
export class RegistrationsController {
  private readonly registrationsService: RegistrationsService;
  public constructor(registrationsService: RegistrationsService) {
    this.registrationsService = registrationsService;
  }

  @ApiOperation({ summary: 'Create registration' })
  @ApiResponse({ status: 201, description: 'Created registration' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @Post('programs/:programId/registrations')
  public async create(
    @Body() createRegistrationDto: CreateRegistrationDto,
    @Param('programId') programId,
    @User('id') userId: number,
  ): Promise<RegistrationEntity> {
    return await this.registrationsService.create(
      createRegistrationDto,
      Number(programId),
      userId,
    );
  }

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

  @Permissions(PermissionEnum.RegistrationCREATE)
  @ApiOperation({
    summary: 'Import set of registered PAs, from JSON only used in testing ATM',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @Post('programs/:programId/registrations/import-registrations-cypress')
  public async importRegistrationsJSON(
    @Body() data: ImportRegistrationsDto[],
    @Param() params,
  ): Promise<ImportResult> {
    if (process.env.NODE_ENV === 'development') {
      return await this.registrationsService.importValidatedRegistrations(
        data,
        Number(params.programId),
      );
    } else {
      throw new HttpException(
        { errors: 'This endpoint only works in development' },
        HttpStatus.NOT_FOUND,
      );
    }
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
  @Get('programs/:programId/registrations')
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

  @Permissions(PermissionEnum.RegistrationAttributeUPDATE)
  @ApiOperation({
    summary: 'Update attribute for registration (Used by Aidworker)',
  })
  @ApiResponse({
    status: 201,
    description: 'Updated attribute for registration',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @Post('programs/:programId/registrations/attribute')
  public async setAttribute(
    @Body() updateAttributeDto: UpdateAttributeDto,
  ): Promise<RegistrationEntity> {
    return await this.registrationsService.setAttribute(
      updateAttributeDto.referenceId,
      updateAttributeDto.attribute,
      updateAttributeDto.value,
    );
  }

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

  @Permissions(PermissionEnum.RegistrationPersonalREAD)
  @ApiOperation({ summary: 'Get note for registration' })
  @ApiResponse({ status: 200, description: 'Get note for registration' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({ name: 'referenceId', required: true })
  @Get('programs/:programId/registrations/note/:referenceId')
  public async retrieveNote(@Param() params): Promise<NoteDto> {
    return await this.registrationsService.retrieveNote(params.referenceId);
  }

  @Permissions(PermissionEnum.RegistrationStatusSelectedForValidationUPDATE)
  @ApiOperation({ summary: 'Mark set of PAs for validation' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @Post('programs/:programId/registrations/select-validation')
  public async selectForValidation(
    @Body() referenceIdsData: ReferenceIdsDto,
  ): Promise<void> {
    await this.registrationsService.updateRegistrationStatusBatch(
      referenceIdsData,
      RegistrationStatusEnum.selectedForValidation,
    );
  }

  @Permissions(PermissionEnum.RegistrationStatusNoLongerEligibleUPDATE)
  @ApiOperation({ summary: 'Mark set of PAs as no longer eligible' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @Post('programs/:programId/registrations/no-longer-eligible')
  public async markNoLongerEligible(
    @Body() referenceIdsData: ReferenceIdsDto,
  ): Promise<void> {
    await this.registrationsService.updateRegistrationStatusBatch(
      referenceIdsData,
      RegistrationStatusEnum.noLongerEligible,
    );
  }

  @Permissions(PermissionEnum.RegistrationStatusIncludedUPDATE)
  @ApiOperation({ summary: 'Include set of PAs' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @Post('programs/:programId/registrations/include')
  public async include(
    @Body() referenceIdsData: ReferenceIdsDto,
    @Body() messageData: MessageDto,
  ): Promise<void> {
    await this.registrationsService.updateRegistrationStatusBatch(
      referenceIdsData,
      RegistrationStatusEnum.included,
      messageData.message,
      MessageContentType.included,
    );
  }

  @Permissions(PermissionEnum.RegistrationStatusInclusionEndedUPDATE)
  @ApiOperation({ summary: 'End inclusion of set of PAs' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @Post('programs/:programId/registrations/end')
  public async end(
    @Body() referenceIdsData: ReferenceIdsDto,
    @Body() messageData: MessageDto,
  ): Promise<void> {
    await this.registrationsService.updateRegistrationStatusBatch(
      referenceIdsData,
      RegistrationStatusEnum.inclusionEnded,
      messageData.message,
      MessageContentType.inclusionEnded,
    );
  }

  @Permissions(PermissionEnum.RegistrationStatusRejectedUPDATE)
  @ApiOperation({ summary: 'Reject set of PAs' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @Post('programs/:programId/registrations/reject')
  public async reject(
    @Body() referenceIdsData: ReferenceIdsDto,
    @Body() messageData: MessageDto,
  ): Promise<void> {
    await this.registrationsService.updateRegistrationStatusBatch(
      referenceIdsData,
      RegistrationStatusEnum.rejected,
      messageData.message,
      MessageContentType.rejected,
    );
  }

  @Permissions(PermissionEnum.RegistrationStatusInvitedUPDATE)
  @ApiOperation({ summary: 'Invite set of PAs for registration' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @Post('programs/:programId/registrations/invite')
  public async invite(
    @Body() referenceIdsData: ReferenceIdsDto,
    @Body() messageData: MessageDto,
  ): Promise<void> {
    await this.registrationsService.updateRegistrationStatusBatch(
      referenceIdsData,
      RegistrationStatusEnum.invited,
      messageData.message,
      MessageContentType.invited,
    );
  }

  // There's no permission check here because there's a check included in the queries done to fetch data.
  @ApiOperation({
    summary:
      'Find registration by phone-number for Redline integration and FieldValidation',
  })
  @ApiResponse({
    status: 200,
    description: 'Return registrations that match the exact phone-number',
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

  @Permissions(PermissionEnum.RegistrationFspUPDATE)
  @ApiOperation({
    summary:
      'Update chosen FSP and attributes. This will delete any custom data field related to the old FSP!',
  })
  @ApiResponse({
    status: 201,
    description: 'Updated fsp and attributes',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @Post('programs/:programId/registrations/update-chosen-fsp')
  public async updateChosenFsp(
    @Body() data: UpdateChosenFspDto,
  ): Promise<RegistrationEntity> {
    return await this.registrationsService.updateChosenFsp(
      data.referenceId,
      data.newFspName,
      data.newFspAttributes,
    );
  }

  @Permissions(PermissionEnum.RegistrationDELETE)
  @ApiOperation({ summary: 'Delete set of registrations' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @Post('programs/:programId/registrations/delete')
  public async delete(
    @Body() referenceIdsData: ReferenceIdsDto,
  ): Promise<void> {
    await this.registrationsService.deleteBatch(referenceIdsData);
  }

  // There's no permission check here because there's a check included in the queries done to fetch data.
  @ApiOperation({ summary: 'Download all program answers (for validation)' })
  @ApiResponse({ status: 200, description: 'Program answers downloaded' })
  @Get('registrations/download/validation-data')
  public async downloadValidationData(
    @User('id') userId: number,
  ): Promise<DownloadData> {
    return await this.registrationsService.downloadValidationData(userId);
  }

  // There's no permission check here because there's a check included in the queries done to fetch data.
  @ApiOperation({
    summary: 'Get registration with prefilled answers (for AW)',
  })
  @ApiResponse({ status: 200 })
  @ApiParam({
    name: 'referenceId',
  })
  @Get('registrations/get/:referenceId')
  public async getRegistration(
    @Param() params,
    @User('id') userId: number,
  ): Promise<RegistrationEntity> {
    return await this.registrationsService.getRegistrationToValidate(
      params.referenceId,
      userId,
    );
  }

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

  @Permissions(PermissionEnum.RegistrationPersonalUPDATE)
  @ApiOperation({ summary: 'Issue validationData (For AW)' })
  @ApiResponse({ status: 200, description: 'Validation Data issued' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @Post('programs/:programId/registrations/issue-validation')
  public async issue(
    @Body() validationIssueData: ValidationIssueDataDto,
    @Param('programId') programId,
  ): Promise<void> {
    return await this.registrationsService.issueValidation(
      validationIssueData,
      programId,
    );
  }

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
