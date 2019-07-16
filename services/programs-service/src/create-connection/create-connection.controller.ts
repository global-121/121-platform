import { CreateConnectionService } from './create-connection.service';
import { Controller, Post, Body } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiUseTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { CreateConnectionDto } from './dto/create-connection.dto';

@ApiBearerAuth()
@ApiUseTags('create-connection')
@Controller('create-connection')
export class CreateConnectionController {
  private readonly createConnectionService: CreateConnectionService;
  public constructor(createConnectionService: CreateConnectionService) {
    this.createConnectionService = createConnectionService;
  }

  @ApiOperation({ title: 'Create connection' })
  @ApiResponse({ status: 200, description: 'Create connection' })
  @Post()
  public async create(@Body() did: CreateConnectionDto): Promise<any> {
    return await this.createConnectionService.create(did);
  }
}
