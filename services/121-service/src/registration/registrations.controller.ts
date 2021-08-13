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
import { RolesGuard } from '../roles.guard';
import { RegistrationsService } from './registrations.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { User } from '../user/user.decorator';
import { UpdateRegistrationDto } from './dto/update-registration.dto';
import { StoreProgramAnswersDto } from './dto/store-program-answers.dto';
import { ProgramAnswerEntity } from './program-answer.entity';
import { SetFspDto, UpdateChosenFspDto } from '../connection/dto/set-fsp.dto';
import { CustomDataDto } from '../programs/program/dto/custom-data.dto';
import { SetPhoneRequestDto } from '../connection/dto/set-phone-request.dto';
import {
  ReferenceIdDto,
  ReferenceIdsDto,
} from '../programs/program/dto/reference-id.dto';
import { AddQrIdentifierDto } from '../connection/dto/add-qr-identifier.dto';
import { UserRole } from '../user-role.enum';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportResult } from '../connection/dto/bulk-import.dto';
import { Roles } from '../roles.decorator';
import { NoteDto, UpdateNoteDto } from '../connection/dto/note.dto';
import { UpdateAttributeDto } from '../connection/dto/update-attribute.dto';
import { ExportDetails } from '../programs/program/dto/export-details';
import { MessageDto } from '../programs/program/dto/message.dto';
import { PaStatusTimestampField } from '../models/pa-status.model';
import { RegistrationStatusEnum } from './enum/registration-status.enum';
import { SearchRegistrationDto } from '../connection/dto/search-registration.dto';

@ApiBearerAuth()
@UseGuards(RolesGuard)
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

  @ApiOperation({ title: 'Update registration' })
  @ApiResponse({ status: 200, description: 'Updated registration' })
  @Post('update-status')
  public async updateRegistrationStatus(
    @Body() updateRegistrationDto: UpdateRegistrationDto,
  ): Promise<RegistrationEntity> {
    return await this.registrationsService.setRegistrationStatus(
      updateRegistrationDto.referenceId,
      updateRegistrationDto.registrationStatus,
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
      storeProgramAnswersDto,
    );
  }

  @ApiOperation({ title: 'Set Financial Service Provider (FSP)' })
  @ApiResponse({ status: 200, description: 'FSP set for registration' })
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

  @Roles(UserRole.RunProgram, UserRole.PersonalData)
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

  @Roles(UserRole.RunProgram, UserRole.PersonalData)
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

  @Roles(UserRole.PersonalData, UserRole.Admin)
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

  @Roles(UserRole.View, UserRole.RunProgram)
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

  @Roles(UserRole.View, UserRole.PersonalData)
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

  @Roles(UserRole.PersonalData)
  @ApiOperation({
    title: 'Get an exported list of people',
  })
  @ApiResponse({
    status: 200,
    description: 'List of people exported',
  })
  @Post('export-list')
  public async getExportList(
    @Body() data: ExportDetails,
    @User('id') userId: number,
  ): Promise<any> {
    return await this.registrationsService.getExportList(
      data.programId,
      data.type,
      data.installment,
      userId,
    );
  }

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

  @ApiOperation({ title: 'Update note for registration' })
  @ApiResponse({ status: 200, description: 'Update note for registration' })
  @Post('/note')
  public async updateNote(@Body() updateNote: UpdateNoteDto): Promise<NoteDto> {
    return await this.registrationsService.updateNote(
      updateNote.referenceId,
      updateNote.note,
    );
  }

  @Roles(UserRole.PersonalData)
  @ApiOperation({ title: 'Get note for registration' })
  @ApiResponse({ status: 200, description: 'Get note for registration' })
  @ApiImplicitParam({ name: 'referenceId', required: true })
  @Get('/note/:referenceId')
  public async retrieveNote(@Param() params): Promise<NoteDto> {
    return await this.registrationsService.retrieveNote(params.referenceId);
  }

  @Roles(UserRole.RunProgram)
  @ApiOperation({ title: 'Select set of PAs for validation' })
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

  @Roles(UserRole.PersonalData)
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

  @Roles(UserRole.RunProgram, UserRole.PersonalData)
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

  @Roles(UserRole.RunProgram, UserRole.PersonalData)
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

  @Roles(UserRole.PersonalData)
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

  @Roles(UserRole.PersonalData)
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

  @Roles(UserRole.PersonalData)
  @ApiOperation({
    title: 'Find registration by name and/or phone number for PM (Swagger)',
  })
  @ApiResponse({
    status: 200,
    description: 'Returned registrations which match at least one of criteria',
  })
  @Post('/search-name-phone')
  public async getConnectionByPhoneAndOrName(
    @Body() searchRegistrationDto: SearchRegistrationDto,
  ): Promise<RegistrationEntity[]> {
    return await this.registrationsService.searchRegistration(
      searchRegistrationDto.phoneNumber,
      searchRegistrationDto.name,
      searchRegistrationDto.id,
    );
  }

  @Roles(UserRole.FieldValidation)
  @ApiOperation({ title: 'Update chosen fsp and attributes' })
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

  @ApiOperation({ title: 'Delete registration' })
  @ApiResponse({ status: 200, description: 'Deleted registration' })
  @Post('/delete')
  public async delete(@Body() referenceIdDto: ReferenceIdDto): Promise<void> {
    return await this.registrationsService.delete(referenceIdDto.referenceId);
  }
}
