import { CreateConnectionService } from './create-connection.service';
import { Controller, Post, Body, Get } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiUseTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { ConnectionReponseDto } from './dto/connection-response.dto';
import { ConnectionRequestDto } from './dto/connection-request.dto';
import { DidInfoDto } from './dto/did-info.dto';

@ApiBearerAuth()
@ApiUseTags('create-connection')
@Controller('create-connection')
export class CreateConnectionController {
  private readonly createConnectionService: CreateConnectionService;
  public constructor(createConnectionService: CreateConnectionService) {
    this.createConnectionService = createConnectionService;
  }

  @ApiOperation({ title: 'Get connection request' })
  @ApiResponse({ status: 200, description: 'Create connection' })
  @Get()
  public async get(): Promise<ConnectionRequestDto> {
    return await this.createConnectionService.get();
  }

  @ApiOperation({ title: 'Create connection' })
  @ApiResponse({ status: 200, description: 'Create connection' })
  @Post()
  public async create(@Body() didVerMeta: ConnectionReponseDto): Promise<void> {
    return await this.createConnectionService.create(didVerMeta);
  }

  @ApiOperation({ title: 'Create connection' })
  @ApiResponse({ status: 200, description: 'Create connection' })
  @Post('create-connection/add')
  public async addLedger(@Body() didVerMeta: DidInfoDto): Promise<void> {
    return await this.createConnectionService.addLedger(didVerMeta);
  }
}
