import { DidDto } from './dto/did.dto';
import { CreateConnectionService } from './create-connection.service';
import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiUseTags,
  ApiOperation,
  ApiResponse,
  ApiImplicitParam,
} from '@nestjs/swagger';
import { ConnectionReponseDto } from './dto/connection-response.dto';
import { ConnectionRequestDto } from './dto/connection-request.dto';
import { ConnectionEntity } from './connection.entity';
import { PasswordDto } from './dto/password.dto';
import { SetPhoneRequestDto } from './dto/set-phone-request.dto';
import { SetFspDto } from './dto/set-fsp.dto';
import { CustomDataDto } from '../../programs/program/dto/custom-data.dto';
import { RolesGuard } from '../../roles.guard';
import { Roles } from '../../roles.decorator';
import { UserRole } from '../../user-role.enum';
@ApiBearerAuth()
@UseGuards(RolesGuard)
@ApiUseTags('sovrin')
@Controller('sovrin/create-connection')
export class CreateConnectionController {
  private readonly createConnectionService: CreateConnectionService;
  public constructor(createConnectionService: CreateConnectionService) {
    this.createConnectionService = createConnectionService;
  }

  @ApiOperation({ title: 'Get connection request' })
  @ApiResponse({ status: 200, description: 'Sent connection request' })
  @Get()
  public async get(): Promise<ConnectionRequestDto> {
    return await this.createConnectionService.get();
  }

  @ApiOperation({ title: 'Create connection' })
  @ApiResponse({ status: 200, description: 'Created connection' })
  @Post()
  public async create(
    @Body() didVerMeta: ConnectionReponseDto,
  ): Promise<ConnectionEntity> {
    return await this.createConnectionService.create(didVerMeta);
  }

  @ApiOperation({ title: 'Delete connection' })
  @ApiResponse({ status: 200, description: 'Deleted connection' })
  @Post('/delete')
  public async delete(@Body() didObject: DidDto): Promise<void> {
    return await this.createConnectionService.delete(didObject);
  }

  @ApiOperation({ title: 'Connection applies for program' })
  @ApiResponse({ status: 200, description: 'Connection applied for program' })
  @ApiImplicitParam({ name: 'programId', required: true })
  @Post('/apply-program/:programId')
  public async applyProgram(
    @Body() didObject: DidDto,
    @Param() params,
  ): Promise<void> {
    return await this.createConnectionService.applyProgram(
      didObject.did,
      params.programId,
    );
  }

  @ApiOperation({ title: 'Set phone number' })
  @ApiResponse({ status: 200, description: 'Phone set for connection' })
  @Post('/phone')
  public async addPhone(
    @Body() setPhoneRequest: SetPhoneRequestDto,
  ): Promise<void> {
    return await this.createConnectionService.addPhone(
      setPhoneRequest.did,
      setPhoneRequest.phonenumber,
      setPhoneRequest.language,
    );
  }

  @ApiOperation({ title: 'Set Financial Service Provider (FSP)' })
  @ApiResponse({ status: 200, description: 'FSP set for connection' })
  @Post('/fsp')
  public async addFsp(@Body() setFsp: SetFspDto): Promise<ConnectionEntity> {
    return await this.createConnectionService.addFsp(setFsp.did, setFsp.fspId);
  }

  @ApiOperation({ title: 'Set custom data for connection' })
  @ApiResponse({ status: 200, description: 'Custom data  set for connection' })
  @Post('/custom-data')
  public async addCustomData(
    @Body() customData: CustomDataDto,
  ): Promise<ConnectionEntity> {
    return await this.createConnectionService.addCustomData(
      customData.did,
      customData.key,
      customData.value,
    );
  }

  @Roles(UserRole.ProgramManager, UserRole.PrivacyOfficer)
  @ApiBearerAuth()
  @ApiOperation({ title: 'Get all connections' })
  @ApiResponse({ status: 200, description: 'Got all connections' })
  @Get('/all')
  public async getConnections(): Promise<ConnectionEntity[]> {
    return await this.createConnectionService.getConnections();
  }

}
