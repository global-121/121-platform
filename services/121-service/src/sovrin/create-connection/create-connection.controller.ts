import { CreateConnectionService } from './create-connection.service';
import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiUseTags,
  ApiOperation,
  ApiResponse,
  ApiImplicitParam,
} from '@nestjs/swagger';
import { ConnectionReponseDto } from './dto/connection-response.dto';
import { ConnectionRequestDto } from './dto/connection-request.dto';
import { DidInfoDto } from './dto/did-info.dto';
import { ConnectionEntity } from './connection.entity';
import { PasswordDto } from './dto/password.dto';

@ApiUseTags('sovrin')
@Controller('sovrin/create-connection')
export class CreateConnectionController {
  private readonly createConnectionService: CreateConnectionService;
  public constructor(createConnectionService: CreateConnectionService) {
    this.createConnectionService = createConnectionService;
  }

  @ApiOperation({ title: 'Test SDK' })
  @ApiResponse({ status: 200, description: '...' })
  @Post('/testSDK')
  public async testSDK(): Promise<void> {
    await this.createConnectionService.testSDK();
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

  @ApiOperation({ title: 'Add connection to ledger' })
  @ApiResponse({ status: 200, description: 'Added connection to ledget' })
  @Post('/add')
  public async addLedger(@Body() didVerMeta: DidInfoDto): Promise<void> {
    return await this.createConnectionService.addLedger(didVerMeta);
  }

  @ApiBearerAuth()
  @ApiOperation({ title: 'Get all connections' })
  @ApiResponse({ status: 200, description: 'Got all connections' })
  @Get('/all')
  public async getConnections(): Promise<ConnectionEntity[]> {
    return await this.createConnectionService.getConnections();
  }

  //Server-side
  @ApiOperation({ title: 'Initiate connection server-side' })
  @ApiResponse({ status: 200, description: 'Sent connection request' })
  @Post('/initiate/serverside')
  public async initiateServerside(
    @Param() params,
    @Body() passwordData: PasswordDto,
  ): Promise<any> {
    return await this.createConnectionService.initiateServerside(
      passwordData.password,
    );
  }
}
