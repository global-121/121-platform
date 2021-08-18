import {
  ApiBearerAuth,
  ApiUseTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { UseGuards, Controller, Post, Body } from '@nestjs/common';
import { RolesGuard } from '../roles.guard';
import { ConnectionService } from './connection.service';
import { ReferenceIdDto } from '../programs/program/dto/reference-id.dto';
import { ConnectionEntity } from './connection.entity';
import { Roles } from '../roles.decorator';
import { UserRole } from '../user-role.enum';
import { QrIdentifierDto } from '../registration/dto/qr-identifier.dto';
import { FspAnswersAttrInterface } from '../programs/fsp/fsp-interface';

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

  @ApiOperation({ title: 'Delete connection' })
  @ApiResponse({ status: 200, description: 'Deleted connection' })
  @Post('/delete')
  public async delete(@Body() referenceIdDto: ReferenceIdDto): Promise<void> {
    return await this.connectionService.delete(referenceIdDto.referenceId);
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
}
