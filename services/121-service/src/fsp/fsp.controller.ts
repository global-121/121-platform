import { AdminAuthGuard } from './../guards/admin.guard';
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
import { ApiTags, ApiResponse, ApiOperation, ApiParam } from '@nestjs/swagger';
import { FinancialServiceProviderEntity } from './financial-service-provider.entity';
import { FspAttributeDto, UpdateFspDto } from './dto/update-fsp.dto';
import { FspQuestionEntity } from './fsp-question.entity';
import { PermissionsGuard } from '../guards/permissions.guard';
import { Admin } from '../guards/admin.decorator';

@UseGuards(PermissionsGuard, AdminAuthGuard)
@ApiTags('fsp')
@Controller('fsp')
export class FspController {
  public constructor(private readonly fspService: FspService) {}

  @ApiOperation({ summary: 'Get fsp' })
  @ApiParam({ name: 'fspId', required: true, type: 'integer' })
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

  @Admin()
  @ApiOperation({ summary: 'Update FSP' })
  @Post('update/fsp')
  public async updateFsp(
    @Body() updateFspDto: UpdateFspDto,
  ): Promise<FinancialServiceProviderEntity> {
    return await this.fspService.updateFsp(updateFspDto);
  }

  @Admin()
  @ApiOperation({ summary: 'Update FSP attribute' })
  @Post('update/fsp-attribute')
  public async updateFspAttribute(
    @Body() updateFspAttributeDto: FspAttributeDto,
  ): Promise<FspQuestionEntity> {
    return await this.fspService.updateFspAttribute(updateFspAttributeDto);
  }

  @Admin()
  @ApiOperation({ summary: 'Create FSP attribute' })
  @Post('fsp-attribute')
  public async createFspAttribute(
    @Body() updateFspAttributeDto: FspAttributeDto,
  ): Promise<FspQuestionEntity> {
    return await this.fspService.createFspAttribute(updateFspAttributeDto);
  }

  @Admin()
  @ApiParam({ name: 'fspAttributeId', required: true, type: 'integer' })
  @ApiOperation({ summary: 'Delete FSP attribute' })
  @Delete('fsp-attribute/:fspAttributeId')
  public async deleteFspAttribute(
    @Param() params: any,
  ): Promise<FspQuestionEntity> {
    return await this.fspService.deleteFspAttribute(params.fspAttributeId);
  }
}
