import {
  Post,
  Body,
  Controller,
  Get,
  Param,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { FspService } from './fsp.service';
import {
  ApiUseTags,
  ApiResponse,
  ApiOperation,
  ApiImplicitParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FinancialServiceProviderEntity } from './financial-service-provider.entity';
import { FspAttributeDto, UpdateFspDto } from './dto/update-fsp.dto';
import { FspAttributeEntity } from './fsp-attribute.entity';
import { PermissionsGuard } from '../permissions.guard';
import { Permissions } from '../permissions.decorator';
import { PermissionEnum } from '../user/permission.enum';

@UseGuards(PermissionsGuard)
@ApiUseTags('fsp')
@Controller('fsp')
export class FspController {
  public constructor(private readonly fspService: FspService) {}

  @ApiOperation({ title: 'Get fsp' })
  @ApiImplicitParam({ name: 'fspId', required: true, type: 'integer' })
  @ApiResponse({
    status: 200,
    description: 'Fsp with attributes',
  })
  @Get(':fspId')
  public async getFspById(
    @Param() param,
  ): Promise<FinancialServiceProviderEntity> {
    return await this.fspService.getFspById(param.fspId);
  }

  @Permissions(PermissionEnum.FspUPDATE)
  @ApiOperation({ title: 'Update FSP' })
  @Post('update/fsp')
  public async updateFsp(
    @Body() updateFspDto: UpdateFspDto,
  ): Promise<FinancialServiceProviderEntity> {
    return await this.fspService.updateFsp(updateFspDto);
  }

  @Permissions(PermissionEnum.FspAttributeUPDATE)
  @ApiOperation({ title: 'Update FSP attribute' })
  @Post('update/fsp-attribute')
  public async updateFspAttribute(
    @Body() updateFspAttributeDto: FspAttributeDto,
  ): Promise<FspAttributeEntity> {
    return await this.fspService.updateFspAttribute(updateFspAttributeDto);
  }

  @Permissions(PermissionEnum.FspAttributeCREATE)
  @ApiOperation({ title: 'Create FSP attribute' })
  @Post('fsp-attribute')
  public async createFspAttribute(
    @Body() updateFspAttributeDto: FspAttributeDto,
  ): Promise<FspAttributeEntity> {
    return await this.fspService.createFspAttribute(updateFspAttributeDto);
  }

  @Permissions(PermissionEnum.FspAttributeDELETE)
  @ApiImplicitParam({ name: 'fspAttributeId', required: true, type: 'integer' })
  @ApiOperation({ title: 'Delete FSP attribute' })
  @Delete('fsp-attribute/:fspAttributeId')
  public async deleteFspAttribute(
    @Param() params: any,
  ): Promise<FspAttributeEntity> {
    return await this.fspService.deleteFspAttribute(params.fspAttributeId);
  }
}
