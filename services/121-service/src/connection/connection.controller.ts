import { ReferenceIdDto } from './dto/reference-id.dto';
import { ConnectionService } from './connection.service';
import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Get,
  Put,
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
import { ConnectionEntity } from './connection.entity';
import {
  SetPhoneRequestDto,
  UpdatePhoneRequestDto,
} from './dto/set-phone-request.dto';
import { SetFspDto, UpdateChosenFspDto } from './dto/set-fsp.dto';
import { CustomDataDto } from '../programs/program/dto/custom-data.dto';
import { RolesGuard } from '../roles.guard';
import { Roles } from '../roles.decorator';
import { UserRole } from '../user-role.enum';
import { AddQrIdentifierDto } from './dto/add-qr-identifier.dto';
import { QrIdentifierDto } from './dto/qr-identifier.dto';
import { FspAnswersAttrInterface } from 'src/programs/fsp/fsp-interface';
import { GetConnectionByPhoneNameDto } from './dto/get-connection-by-name-phone';
import { FileInterceptor } from '@nestjs/platform-express';
import { User } from '../user/user.decorator';
import { ImportResult } from './dto/bulk-import.dto';
import { NoteDto, UpdateNoteDto } from './dto/note.dto';
import { UpdateAttributeDto } from './dto/update-attribute.dto';

@ApiBearerAuth()
@UseGuards(RolesGuard)
@ApiUseTags('connection')
@Controller('connection')
export class ConnectionController {
  private readonly connectionService: ConnectionService;
  public constructor(connectionService: ConnectionService) {
    this.connectionService = connectionService;
  }

  @ApiOperation({ title: 'Create connection' })
  @ApiResponse({ status: 200, description: 'Created connection' })
  @Post()
  public async create(
    @Body() referenceIdDto: ReferenceIdDto,
  ): Promise<ConnectionEntity> {
    return await this.connectionService.create(referenceIdDto.referenceId);
  }

  @Roles(UserRole.RunProgram, UserRole.PersonalData)
  @ApiOperation({ title: 'Import set of PAs to invite, based on CSV' })
  @ApiImplicitParam({ name: 'programId', required: true })
  @Post('import-bulk/:programId')
  @ApiConsumes('multipart/form-data')
  @ApiImplicitFile({ name: 'file', required: true })
  @UseInterceptors(FileInterceptor('file'))
  public async importBulk(
    @UploadedFile() csvFile,
    @Param() params,
    @User('id') userId: number,
  ): Promise<ImportResult> {
    return await this.connectionService.importBulk(
      csvFile,
      params.programId,
      userId,
    );
  }

  @Roles(UserRole.Admin)
  @ApiOperation({
    title: 'Import set of registered PAs to test with, based on CSV',
  })
  @ApiImplicitParam({ name: 'programId', required: true })
  @Post('import-test-registrations/:programId')
  @ApiConsumes('multipart/form-data')
  @ApiImplicitFile({ name: 'file', required: true })
  @UseInterceptors(FileInterceptor('file'))
  public async importTestRegistrations(
    @UploadedFile() csvFile,
    @Param() params,
  ): Promise<string> {
    return await this.connectionService.importTestRegistrationsNL(
      csvFile,
      params.programId,
    );
  }

  @ApiOperation({ title: 'Delete connection' })
  @ApiResponse({ status: 200, description: 'Deleted connection' })
  @Post('/delete')
  public async delete(@Body() referenceIdDto: ReferenceIdDto): Promise<void> {
    return await this.connectionService.delete(referenceIdDto.referenceId);
  }

  @ApiOperation({ title: 'Connection applies for program' })
  @ApiResponse({ status: 200, description: 'Connection applied for program' })
  @ApiImplicitParam({ name: 'programId', required: true })
  @Post('/apply-program/:programId')
  public async applyProgram(
    @Body() referenceIdDto: ReferenceIdDto,
    @Param() params,
  ): Promise<void> {
    return await this.connectionService.applyProgram(
      referenceIdDto.referenceId,
      params.programId,
    );
  }

  @ApiOperation({ title: 'Set phone number' })
  @ApiResponse({ status: 200, description: 'Phone set for connection' })
  @Post('/phone')
  public async addPhone(
    @Body() setPhoneRequest: SetPhoneRequestDto,
  ): Promise<void> {
    return await this.connectionService.addPhone(
      setPhoneRequest.referenceId,
      setPhoneRequest.phonenumber,
      setPhoneRequest.language,
      setPhoneRequest.useForInvitationMatching,
    );
  }

  @ApiOperation({ title: 'Set Financial Service Provider (FSP)' })
  @ApiResponse({ status: 200, description: 'FSP set for connection' })
  @Post('/fsp')
  public async addFsp(@Body() setFsp: SetFspDto): Promise<ConnectionEntity> {
    return await this.connectionService.addFsp(
      setFsp.referenceId,
      setFsp.fspId,
    );
  }

  @ApiOperation({ title: 'Set custom data for connection' })
  @ApiResponse({ status: 200, description: 'Custom data  set for connection' })
  @Post('/custom-data')
  public async addCustomData(
    @Body() customData: CustomDataDto,
  ): Promise<ConnectionEntity> {
    return await this.connectionService.addCustomData(
      customData.referenceId,
      customData.key,
      customData.value,
    );
  }

  @ApiOperation({ title: 'Update note for connection' })
  @ApiResponse({ status: 200, description: 'Update note for connection' })
  @Post('/note')
  public async updateNote(
    @Body() updateNote: UpdateNoteDto,
  ): Promise<ConnectionEntity> {
    return await this.connectionService.updateNote(
      updateNote.referenceId,
      updateNote.note,
    );
  }

  @Roles(UserRole.PersonalData)
  @ApiOperation({ title: 'Get note for connection' })
  @ApiResponse({ status: 200, description: 'Get note for connection' })
  @ApiImplicitParam({ name: 'referenceId', required: true })
  @Get('/note/:referenceId')
  public async retrieveNote(@Param() params): Promise<NoteDto> {
    return await this.connectionService.retrieveNote(params.referenceId);
  }

  @ApiOperation({ title: 'Update attribute for connection' })
  @ApiResponse({ status: 200, description: 'Update attribute for connection' })
  @Put('/attribute')
  public async updateAttribute(
    @Body() updateAttributeDto: UpdateAttributeDto,
  ): Promise<ConnectionEntity> {
    return await this.connectionService.updateAttribute(
      updateAttributeDto.referenceId,
      updateAttributeDto.attribute,
      updateAttributeDto.value,
    );
  }

  @Roles(UserRole.FieldValidation, UserRole.PersonalData)
  @ApiOperation({
    title:
      'Overwrite phone number for connection used by AW (app) or PM (Swagger)',
  })
  @ApiResponse({
    status: 200,
    description: 'Phone number overwritten for connection',
  })
  @Post('/phone/overwrite')
  public async phoneNumberOverwrite(
    @Body() setPhoneRequest: UpdatePhoneRequestDto,
  ): Promise<ConnectionEntity> {
    return await this.connectionService.phoneNumberOverwrite(
      setPhoneRequest.referenceId,
      setPhoneRequest.phonenumber,
    );
  }

  @Roles(UserRole.PersonalData)
  @ApiOperation({
    title: 'Find connection by name and/or phone number for PM (Swagger)',
  })
  @ApiResponse({
    status: 200,
    description: 'Returned connections which match at least one of criteria',
  })
  @Post('/get-connection/name-phone')
  public async getConnectionByPhoneAndOrName(
    @Body() getConnectionByPhoneNameDto: GetConnectionByPhoneNameDto,
  ): Promise<ConnectionEntity[]> {
    return await this.connectionService.getConnectionByPhoneAndOrName(
      getConnectionByPhoneNameDto.phoneNumber,
      getConnectionByPhoneNameDto.name,
    );
  }

  @ApiOperation({ title: 'Set qr identifier for connection' })
  @ApiResponse({
    status: 201,
    description: 'Qr identifier  set for connection',
  })
  @Post('/add-qr-identifier')
  public async addQrIdentifier(
    @Body() data: AddQrIdentifierDto,
  ): Promise<void> {
    await this.connectionService.addQrIdentifier(
      data.referenceId,
      data.qrIdentifier,
    );
  }

  @Roles(UserRole.FieldValidation)
  @ApiOperation({ title: 'Find connection using qr identifier' })
  @ApiResponse({
    status: 200,
    description: 'Found connection using qr',
  })
  @Post('/qr-find-connection')
  public async findConnectionWithQrIdentifier(
    @Body() data: QrIdentifierDto,
  ): Promise<ReferenceIdDto> {
    return await this.connectionService.findConnectionWithQrIdentifier(
      data.qrIdentifier,
    );
  }

  @Roles(UserRole.FieldValidation)
  @ApiOperation({ title: 'Find fsp and attributes' })
  @ApiResponse({
    status: 200,
    description: 'Found fsp and attributes',
  })
  @Post('/get-fsp')
  public async getFspAnswersAttributes(
    @Body() referenceIdDto: ReferenceIdDto,
  ): Promise<FspAnswersAttrInterface> {
    return await this.connectionService.getFspAnswersAttributes(
      referenceIdDto.referenceId,
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
  ): Promise<ConnectionEntity> {
    return await this.connectionService.updateChosenFsp(
      data.referenceId,
      data.newFspName,
      data.newFspAttributes,
    );
  }
}
