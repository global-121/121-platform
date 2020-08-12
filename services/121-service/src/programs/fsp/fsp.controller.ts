import { Post, Body, Controller } from '@nestjs/common';
import { FspService } from './fsp.service';
import { ApiUseTags, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { AfricasTalkingValidationDto } from './dto/africas-talking-validation.dto';

@ApiUseTags('fsp')
@Controller('fsp')
export class FspController {
  private readonly fspService: FspService;
  public constructor(fspService: FspService) {
    this.fspService = fspService;
  }

  @ApiOperation({ title: '...' })
  @ApiResponse({ status: 200, description: '...' })
  @Post('africastalking/validation')
  public async statusCallback(
    @Body() africasTalkingValidationData: AfricasTalkingValidationDto,
  ): Promise<void> {
    return await this.fspService.africasTalkingValidation(
      africasTalkingValidationData,
    );
  }
}
