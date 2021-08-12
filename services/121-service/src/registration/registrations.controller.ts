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
import { SetFspDto } from '../connection/dto/set-fsp.dto';
import { CustomDataDto } from '../programs/program/dto/custom-data.dto';
import { SetPhoneRequestDto } from '../connection/dto/set-phone-request.dto';
import { ReferenceIdDto } from '../programs/program/dto/reference-id.dto';
import { AddQrIdentifierDto } from '../connection/dto/add-qr-identifier.dto';
import { UserRole } from '../user-role.enum';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportResult } from '../connection/dto/bulk-import.dto';
import { Roles } from '../roles.decorator';

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
}
