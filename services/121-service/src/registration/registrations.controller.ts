import { PersonAffectedAuthGuard } from '../person-affected-auth.guard';
import { PermissionsGuard } from './../permissions.guard';
import { RegistrationEntity } from './registration.entity';
import {
  Post,
  Body,
  Controller,
  UseGuards,
  Param,
  UploadedFile,
  UseInterceptors,
  Get,
  ParseArrayPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiConsumes,
  ApiProperty,
  ApiBody,
} from '@nestjs/swagger';
import { RegistrationsService } from './registrations.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { User } from '../user/user.decorator';
import { StoreProgramAnswersDto } from './dto/store-program-answers.dto';
import { SetFspDto, UpdateChosenFspDto } from './dto/set-fsp.dto';
import { CustomDataDto } from './dto/custom-data.dto';
import { AddQrIdentifierDto } from './dto/add-qr-identifier.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportResult } from './dto/bulk-import.dto';
import { NoteDto, UpdateNoteDto } from './dto/note.dto';
import { MessageDto } from './dto/message.dto';
import { RegistrationStatusEnum } from './enum/registration-status.enum';
import { SearchRegistrationDto } from './dto/search-registration.dto';
import { DownloadData } from './dto/download-data.interface';
import { SetPhoneRequestDto } from './dto/set-phone-request.dto';
import { UpdateAttributeDto } from './dto/update-attribute.dto';
import { FspAnswersAttrInterface } from '../fsp/fsp-interface';
import { QrIdentifierDto } from './dto/qr-identifier.dto';
import { ValidationIssueDataDto } from './dto/validation-issue-data.dto';
import { ReferenceIdDto, ReferenceIdsDto } from './dto/reference-id.dto';
import { MessageHistoryDto } from './dto/message-history.dto';
import { SendCustomTextDto } from './dto/send-custom-text.dto';
import { Permissions } from '../permissions.decorator';
import { PermissionEnum } from '../user/permission.enum';
import { PersonAffectedAuth } from '../person-affected-auth.decorator';
import { FILE_UPLOAD_API_FORMAT } from '../shared/file-upload-api-format';

export class FileUploadDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  public file: any;
}
@UseGuards(PermissionsGuard, PersonAffectedAuthGuard)
@ApiTags('registrations')
@Controller('registrations')
export class RegistrationsController {
  private readonly registrationsService: RegistrationsService;
  public constructor(registrationsService: RegistrationsService) {
    this.registrationsService = registrationsService;
  }

  @ApiOperation({ summary: 'Create registration' })
  @ApiResponse({ status: 200, description: 'Created registration' })
  @Post()
  public async create(
    @Body() createRegistrationDto: CreateRegistrationDto,
    @User('id') userId: number,
  ): Promise<RegistrationEntity> {
    return await this.registrationsService.create(
      createRegistrationDto,
      userId,
    );
  }

  @PersonAffectedAuth()
  @ApiOperation({
    summary: 'Store program answers for registration (Used by Person Affected)',
  })
  @ApiResponse({
    status: 200,
    description: 'Stored program answers for registration',
  })
  @Post('program-answers')
  public async storeProgramAnswers(
    @Body() storeProgramAnswersDto: StoreProgramAnswersDto,
  ): Promise<void> {
    return await this.registrationsService.storeProgramAnswers(
      storeProgramAnswersDto.referenceId,
      storeProgramAnswersDto.programAnswers,
    );
  }

  @PersonAffectedAuth()
  @ApiOperation({ summary: 'Set Financial Service Provider (FSP)' })
  @ApiResponse({ status: 200 })
  @Post('/fsp')
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
    status: 200,
    description: 'Custom data  set for registration',
  })
  @Post('/custom-data')
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
  @ApiResponse({ status: 200, description: 'Phone set for registration' })
  @Post('/phone')
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
  @ApiOperation({ summary: 'Set QR identifier for registration' })
  @ApiResponse({
    status: 201,
    description: 'QR identifier set for registration',
  })
  @Post('/add-qr-identifier')
  public async addQrIdentifier(
    @Body() data: AddQrIdentifierDto,
  ): Promise<void> {
    await this.registrationsService.addQrIdentifier(
      data.referenceId,
      data.qrIdentifier,
    );
  }

  @PersonAffectedAuth()
  @ApiOperation({
    summary:
      'Person Affected switches from started registration to registered for program',
  })
  @ApiResponse({
    status: 200,
    description:
      'Person Affected switched from started registration to registered for program',
  })
  @Post('/register')
  public async register(
    @Body() referenceIdDto: ReferenceIdDto,
  ): Promise<ReferenceIdDto | boolean> {
    return await this.registrationsService.register(referenceIdDto.referenceId);
  }

  @Permissions(PermissionEnum.RegistrationCREATE)
  @ApiOperation({ summary: 'Import set of PAs to invite, based on CSV' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @Post('import-bulk/:programId')
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
  @Get('import-template/:programId/:type')
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
  @Post('import-registrations/:programId')
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

  @Permissions(PermissionEnum.RegistrationREAD)
  @ApiOperation({
    summary: 'Get all People Affected for program EXCLUDING personal data',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiResponse({
    status: 200,
    description: 'Got all People Affected for program EXCLUDING personal data',
  })
  @Get(':programId')
  public async getPeopleAffected(@Param() params): Promise<any[]> {
    return await this.registrationsService.getRegistrationsForProgram(
      Number(params.programId),
      false,
    );
  }

  @Permissions(PermissionEnum.RegistrationPersonalREAD)
  @ApiOperation({
    summary: 'Get all People Affected for program INCLUDING personal data',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiResponse({
    status: 200,
    description: 'Get all People Affected for program INCLUDING personal data',
  })
  @Get('personal-data/:programId')
  public async getPeopleAffectedWithPersonalData(
    @Param() params,
  ): Promise<any[]> {
    return await this.registrationsService.getRegistrationsForProgram(
      Number(params.programId),
      true,
    );
  }

  @Permissions(PermissionEnum.RegistrationAttributeUPDATE)
  @ApiOperation({
    summary: 'Update attribute for registration (Used by Aidworker)',
  })
  @ApiResponse({
    status: 200,
    description: 'Updated attribute for registration',
  })
  @Post('/attribute')
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
  @ApiResponse({ status: 200, description: 'Update note for registration' })
  @Post('/note')
  public async updateNote(@Body() updateNote: UpdateNoteDto): Promise<NoteDto> {
    return await this.registrationsService.updateNote(
      updateNote.referenceId,
      updateNote.note,
    );
  }

  @Permissions(PermissionEnum.RegistrationPersonalREAD)
  @ApiOperation({ summary: 'Get note for registration' })
  @ApiResponse({ status: 200, description: 'Get note for registration' })
  @ApiParam({ name: 'referenceId', required: true })
  @Get('/note/:referenceId')
  public async retrieveNote(@Param() params): Promise<NoteDto> {
    return await this.registrationsService.retrieveNote(params.referenceId);
  }

  @Permissions(PermissionEnum.RegistrationStatusSelectedForValidationUPDATE)
  @ApiOperation({ summary: 'Mark set of PAs for validation' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @Post('select-validation/:programId')
  public async selectForValidation(
    @Param() params,
    @Body() data: ReferenceIdsDto,
  ): Promise<void> {
    await this.registrationsService.updateRegistrationStatusBatch(
      params.programId,
      data,
      RegistrationStatusEnum.selectedForValidation,
    );
  }

  @Permissions(PermissionEnum.RegistrationStatusNoLongerEligibleUPDATE)
  @ApiOperation({ summary: 'Mark set of PAs as no longer eligible' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @Post('no-longer-eligible/:programId')
  public async markNoLongerEligible(
    @Param() params,
    @Body() data: ReferenceIdsDto,
  ): Promise<void> {
    await this.registrationsService.updateRegistrationStatusBatch(
      Number(params.programId),
      data,
      RegistrationStatusEnum.noLongerEligible,
    );
  }

  @Permissions(PermissionEnum.RegistrationStatusIncludedUPDATE)
  @ApiOperation({ summary: 'Include set of PAs' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @Post('include/:programId')
  public async include(
    @Param() params,
    @Body() referenceIdsData: ReferenceIdsDto,
    @Body() messageData: MessageDto,
  ): Promise<void> {
    await this.registrationsService.updateRegistrationStatusBatch(
      Number(params.programId),
      referenceIdsData,
      RegistrationStatusEnum.included,
      messageData.message,
    );
  }

  @Permissions(PermissionEnum.RegistrationStatusInclusionEndedUPDATE)
  @ApiOperation({ summary: 'End inclusion of set of PAs' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @Post('end/:programId')
  public async end(
    @Param() params,
    @Body() referenceIdsData: ReferenceIdsDto,
    @Body() messageData: MessageDto,
  ): Promise<void> {
    await this.registrationsService.updateRegistrationStatusBatch(
      Number(params.programId),
      referenceIdsData,
      RegistrationStatusEnum.inclusionEnded,
      messageData.message,
    );
  }

  @Permissions(PermissionEnum.RegistrationStatusRejectedUPDATE)
  @ApiOperation({ summary: 'Reject set of PAs' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @Post('reject/:programId')
  public async reject(
    @Param() params,
    @Body() referenceIdsData: ReferenceIdsDto,
    @Body() messageData: MessageDto,
  ): Promise<void> {
    await this.registrationsService.updateRegistrationStatusBatch(
      Number(params.programId),
      referenceIdsData,
      RegistrationStatusEnum.rejected,
      messageData.message,
    );
  }

  @Permissions(PermissionEnum.RegistrationStatusInvitedUPDATE)
  @ApiOperation({ summary: 'Invite set of PAs for registration' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @Post('invite/:programId')
  public async invite(
    @Param() params,
    @Body() phoneNumbers: string,
    @Body() messageData: MessageDto,
  ): Promise<void> {
    await this.registrationsService.invite(
      Number(params.programId),
      phoneNumbers,
      messageData.message,
    );
  }

  @Permissions(PermissionEnum.RegistrationPersonalSEARCH)
  @ApiOperation({
    summary:
      'Find registration by name and/or phone number for PM and FieldValidation',
  })
  @ApiResponse({
    status: 200,
    description: 'Returned registrations which match at least one of criteria',
  })
  @Post('/search-name-phone')
  public async searchRegistration(
    @Body() searchRegistrationDto: SearchRegistrationDto,
  ): Promise<RegistrationEntity[]> {
    return await this.registrationsService.searchRegistration(
      searchRegistrationDto.phoneNumber,
      searchRegistrationDto.name,
    );
  }

  @Permissions(PermissionEnum.RegistrationFspUPDATE)
  @ApiOperation({
    summary:
      'Update chosen FSP and attributes. This will delete any custom data field related to the old FSP!',
  })
  @ApiResponse({
    status: 200,
    description: 'Updated fsp and attributes',
  })
  @Post('/update-chosen-fsp')
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
  @Post('delete')
  public async delete(@Body() data: ReferenceIdsDto): Promise<void> {
    await this.registrationsService.deleteBatch(data);
  }

  @Permissions(PermissionEnum.RegistrationPersonalForValidationREAD)
  @ApiOperation({ summary: 'Download all program answers (for validation)' })
  @ApiResponse({ status: 200, description: 'Program answers downloaded' })
  @Get('/download/validation-data')
  public async downloadValidationData(
    @User('id') userId: number,
  ): Promise<DownloadData> {
    return await this.registrationsService.downloadValidationData(userId);
  }

  @Permissions(PermissionEnum.RegistrationPersonalForValidationREAD)
  @ApiOperation({ summary: 'Get registration with prefilled answers (for AW)' })
  @ApiResponse({ status: 200 })
  @ApiParam({
    name: 'referenceId',
  })
  @Get('get/:referenceId')
  public async getRegistration(@Param() params): Promise<RegistrationEntity> {
    return await this.registrationsService.getRegistrationToValidate(
      params.referenceId,
    );
  }

  @Permissions(PermissionEnum.RegistrationFspREAD)
  @ApiOperation({ summary: 'Find FSP and attributes' })
  @ApiResponse({
    status: 200,
    description: 'Found fsp and attributes',
  })
  @Post('/get-fsp')
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
  @Post('/issue-validation')
  public async issue(
    @Body() validationIssueData: ValidationIssueDataDto,
  ): Promise<void> {
    return await this.registrationsService.issueValidation(validationIssueData);
  }

  @Permissions(PermissionEnum.RegistrationReferenceIdSEARCH)
  @ApiOperation({ summary: 'Find reference id using qr identifier' })
  @ApiResponse({
    status: 200,
    description: 'Found reference id using qr',
  })
  @Post('/qr-find-reference-id')
  public async findReferenceIdWithQrIdentifier(
    @Body() data: QrIdentifierDto,
  ): Promise<ReferenceIdDto> {
    return await this.registrationsService.findReferenceIdWithQrIdentifier(
      data.qrIdentifier,
    );
  }

  @Permissions(PermissionEnum.RegistrationNotificationCREATE)
  @ApiOperation({
    summary:
      'Send custom text-message (whatsapp or sms) to array of registrations',
  })
  @Post('text-message')
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
  @Get('message-history/:referenceId')
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
  @ApiParam({
    name: 'referenceId',
  })
  @Get('status/:referenceId')
  public async getRegistrationStatus(@Param() params): Promise<any> {
    const status = await this.registrationsService.getRegistrationStatus(
      params.referenceId,
    );

    return { status };
  }
}
