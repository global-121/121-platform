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
  public async create(@Body() didVerMeta: ConnectionReponseDto): Promise<void> {
    return await this.createConnectionService.create(didVerMeta);
  }

  @ApiOperation({ title: 'Add connection to ledger' })
  @ApiResponse({ status: 200, description: 'Added connection to ledget' })
  @Post('/add')
  public async addLedger(@Body() didVerMeta: DidInfoDto): Promise<void> {
    return await this.createConnectionService.addLedger(didVerMeta);
  }
}
