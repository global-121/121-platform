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
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiUseTags,
  ApiOperation,
  ApiResponse,
  ApiImplicitParam,
  ApiConsumes,
  ApiImplicitFile,
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
import { InclusionStatus } from './dto/inclusion-status.dto';
import { ReferenceIdDto, ReferenceIdsDto } from './dto/reference-id.dto';
import { MessageHistoryDto } from './dto/message-history.dto';
import { SendCustomTextDto } from './dto/send-custom-text.dto';
import { Permissions } from '../permissions.decorator';
import { PermissionEnum } from '../user/permission.enum';

@ApiBearerAuth()
@UseGuards(PermissionsGuard)
@ApiUseTags('registrations')
@Controller('registrations')
export class RegistrationsController {
  private readonly registrationsService: RegistrationsService;
  public constructor(registrationsService: RegistrationsService) {
    this.registrationsService = registrationsService;
  }

  @ApiOperation({ title: 'Create registration' })
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

  @ApiOperation({ title: 'Store program answers for registration' })
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

  @ApiOperation({ title: 'Set Financial Service Provider (FSP)' })
  @ApiResponse({ status: 200 })
  @Post('/fsp')
  public async addFsp(@Body() setFsp: SetFspDto): Promise<RegistrationEntity> {
    return await this.registrationsService.addFsp(
      setFsp.referenceId,
      setFsp.fspId,
    );
  }

  @ApiOperation({ title: 'Set custom data for registration' })
  @ApiResponse({
    status: 200,
    description: 'Custom data  set for registration',
  })
  @Post('/custom-data')
  public async addCustomData(
    @Body() customData: CustomDataDto,
  ): Promise<RegistrationEntity> {
    return await this.registrationsService.addCustomData(
      customData.referenceId,
      customData.key,
      customData.value,
    );
  }

  @ApiOperation({ title: 'Set phone number' })
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

  @ApiOperation({ title: 'Set QR identifier for registration' })
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

  @ApiOperation({
    title:
      'Person Affected switches from started registration to registered for program',
  })
  @ApiResponse({
    status: 200,
    description:
      'Person Affected switched from started registration to registered for program',
  })
  @Post('/register')
  public async register(@Body() referenceIdDto: ReferenceIdDto): Promise<void> {
    return await this.registrationsService.register(referenceIdDto.referenceId);
  }

  @Permissions(PermissionEnum.RegistrationCREATE)
  @ApiOperation({ title: 'Import set of PAs to invite, based on CSV' })
  @ApiImplicitParam({ name: 'programId', required: true, type: 'integer' })
  @Post('import-bulk/:programId')
  @ApiConsumes('multipart/form-data')
  @ApiImplicitFile({ name: 'file', required: true })
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
    title: 'Get a CSV template for importing registrations',
  })
  @ApiImplicitParam({ name: 'programId', required: true, type: 'integer' })
  @Get('import-template/:programId')
  public async getImportRegistrationsTemplate(
    @Param() params,
  ): Promise<string[]> {
    return await this.registrationsService.getImportRegistrationsTemplate(
      Number(params.programId),
    );
  }

  @Permissions(PermissionEnum.RegistrationCREATE)
  @ApiOperation({
    title: 'Import set of registered PAs, from CSV',
  })
  @ApiImplicitParam({ name: 'programId', required: true, type: 'integer' })
  @Post('import-registrations/:programId')
  @ApiConsumes('multipart/form-data')
  @ApiImplicitFile({ name: 'file', required: true })
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
    title: 'Get all People Affected for program EXCLUDING personal data',
  })
  @ApiImplicitParam({ name: 'programId', required: true, type: 'integer' })
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
    title: 'Get all People Affected for program INCLUDING personal data',
  })
  @ApiImplicitParam({ name: 'programId', required: true, type: 'integer' })
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
  @ApiOperation({ title: 'Update attribute for registration' })
  @ApiResponse({
    status: 200,
    description: 'Updated attribute for registration',
  })
  @Post('/attribute')
  public async updateAttribute(
    @Body() updateAttributeDto: UpdateAttributeDto,
  ): Promise<RegistrationEntity> {
    return await this.registrationsService.updateAttribute(
      updateAttributeDto.referenceId,
      updateAttributeDto.attribute,
      updateAttributeDto.value,
    );
  }

  @Permissions(PermissionEnum.RegistrationPersonalUPDATE)
  @ApiOperation({ title: 'Update note for registration' })
  @ApiResponse({ status: 200, description: 'Update note for registration' })
  @Post('/note')
  public async updateNote(@Body() updateNote: UpdateNoteDto): Promise<NoteDto> {
    return await this.registrationsService.updateNote(
      updateNote.referenceId,
      updateNote.note,
    );
  }

  @Permissions(PermissionEnum.RegistrationPersonalREAD)
  @ApiOperation({ title: 'Get note for registration' })
  @ApiResponse({ status: 200, description: 'Get note for registration' })
  @ApiImplicitParam({ name: 'referenceId', required: true })
  @Get('/note/:referenceId')
  public async retrieveNote(@Param() params): Promise<NoteDto> {
    return await this.registrationsService.retrieveNote(params.referenceId);
  }

  @Permissions(PermissionEnum.RegistrationStatusSelectedForValidationUPDATE)
  @ApiOperation({ title: 'Mark set of PAs for validation' })
  @ApiImplicitParam({ name: 'programId', required: true, type: 'integer' })
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
  @ApiOperation({ title: 'Mark set of PAs as no longer eligible' })
  @ApiImplicitParam({ name: 'programId', required: true, type: 'integer' })
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
  @ApiOperation({ title: 'Include set of PAs' })
  @ApiImplicitParam({ name: 'programId', required: true, type: 'integer' })
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

  @Permissions(PermissionEnum.RegistrationStatusRejectedUPDATE)
  @ApiOperation({ title: 'End inclusion of set of PAs' })
  @ApiImplicitParam({ name: 'programId', required: true, type: 'integer' })
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
  @ApiOperation({ title: 'Reject set of PAs' })
  @ApiImplicitParam({ name: 'programId', required: true, type: 'integer' })
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
  @ApiOperation({ title: 'Invite set of PAs for registration' })
  @ApiImplicitParam({ name: 'programId', required: true, type: 'integer' })
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
    title:
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
      searchRegistrationDto.id,
    );
  }

  @Permissions(PermissionEnum.RegistrationFspUPDATE)
  @ApiOperation({
    title:
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
  @ApiOperation({ title: 'Delete set of registrations' })
  @Post('delete')
  public async delete(@Body() data: ReferenceIdsDto): Promise<void> {
    await this.registrationsService.deleteBatch(data);
  }

  @Permissions(PermissionEnum.RegistrationPersonalForValidationREAD)
  @ApiOperation({ title: 'Download all program answers (for validation)' })
  @ApiResponse({ status: 200, description: 'Program answers downloaded' })
  @Get('/download/validation-data')
  public async downloadValidationData(
    @User('id') userId: number,
  ): Promise<DownloadData> {
    return await this.registrationsService.downloadValidationData(userId);
  }

  @Permissions(PermissionEnum.RegistrationPersonalForValidationREAD)
  @ApiOperation({ title: 'Get registration with prefilled answers (for AW)' })
  @ApiResponse({ status: 200 })
  @ApiImplicitParam({
    name: 'referenceId',
  })
  @Get('get/:referenceId')
  public async getRegistration(@Param() params): Promise<RegistrationEntity> {
    return await this.registrationsService.get(params.referenceId);
  }

  @Permissions(PermissionEnum.RegistrationFspREAD)
  @ApiOperation({ title: 'Find FSP and attributes' })
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
  @ApiOperation({ title: 'Issue validationData (For AW)' })
  @ApiResponse({ status: 200, description: 'Validation Data issued' })
  @Post('/issue-validation')
  public async issue(
    @Body() validationIssueData: ValidationIssueDataDto,
  ): Promise<void> {
    return await this.registrationsService.issueValidation(validationIssueData);
  }

  @Permissions(PermissionEnum.RegistrationReferenceIdSEARCH)
  @ApiOperation({ title: 'Find reference id using qr identifier' })
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

  @ApiOperation({ title: 'Get inclusion status (Used by PA)' })
  @ApiImplicitParam({ name: 'programId', required: true, type: 'integer' })
  @Post('inclusion-status/:programId')
  public async inclusionStatus(
    @Param() params,
    @Body() data: ReferenceIdDto,
  ): Promise<InclusionStatus> {
    return await this.registrationsService.getInclusionStatus(
      Number(params.programId),
      data.referenceId,
    );
  }

  @Permissions(PermissionEnum.RegistratonNotificationCREATE)
  @ApiOperation({
    title:
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

  @Permissions(PermissionEnum.RegistratonNotificationREAD)
  @ApiOperation({ title: 'Get message history for one registration' })
  @Get('message-history/:referenceId')
  public async getMessageHistoryRegistration(
    @Param() params: ReferenceIdDto,
  ): Promise<MessageHistoryDto[]> {
    return await this.registrationsService.getMessageHistoryRegistration(
      params.referenceId,
    );
  }
}
