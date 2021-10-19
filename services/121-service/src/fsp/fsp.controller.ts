import { Post, Body, Controller, Get, Param, UseGuards } from '@nestjs/common';
import { FspService } from './fsp.service';
import {
  ApiUseTags,
  ApiResponse,
  ApiOperation,
  ApiImplicitParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FinancialServiceProviderEntity } from './financial-service-provider.entity';
import { UserRole } from '../user-role.enum';
import { Roles } from '../roles.decorator';
import { UpdateFspAttributeDto, UpdateFspDto } from './api/dto/update-fsp.dto';
import { FspAttributeEntity } from './fsp-attribute.entity';
import { RolesGuard } from '../roles.guard';

@ApiBearerAuth()
@UseGuards(RolesGuard)
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

  @Roles(UserRole.Admin)
  @ApiOperation({ title: 'Update FSP' })
  @Post('update/fsp')
  public async updateFsp(
    @Body() updateFspDto: UpdateFspDto,
  ): Promise<FinancialServiceProviderEntity> {
    return await this.fspService.updateFsp(updateFspDto);
  }

  @Roles(UserRole.Admin)
  @ApiOperation({ title: 'Update FSP attribute' })
  @Post('update/fsp-attribute')
  public async updateFspAttribute(
    @Body() updateFspAttributeDto: UpdateFspAttributeDto,
  ): Promise<FspAttributeEntity> {
    return await this.fspService.updateFspAttribute(updateFspAttributeDto);
  }
}
