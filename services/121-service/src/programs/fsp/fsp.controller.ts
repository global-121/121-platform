import { Post, Body, Controller, Get, Param } from '@nestjs/common';
import { FspService } from './fsp.service';
import {
  ApiUseTags,
  ApiResponse,
  ApiOperation,
  ApiImplicitParam,
} from '@nestjs/swagger';
import { AfricasTalkingValidationDto } from './dto/africas-talking-validation.dto';
import { FinancialServiceProviderEntity } from './financial-service-provider.entity';

@ApiUseTags('fsp')
@Controller('fsp')
export class FspController {
  private readonly fspService: FspService;
  public constructor(fspService: FspService) {
    this.fspService = fspService;
  }

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

  @ApiOperation({
    title:
      'Validation callback used by Africas Talking to request validity of payment to us.',
  })
  @ApiResponse({ status: 200, description: 'Validated' })
  @Post('africastalking/validation')
  public async statusCallback(
    @Body() africasTalkingValidationData: AfricasTalkingValidationDto,
  ): Promise<void> {
    return await this.fspService.africasTalkingValidation(
      africasTalkingValidationData,
    );
  }
}
