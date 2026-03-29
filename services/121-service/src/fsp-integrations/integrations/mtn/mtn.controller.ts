import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { MtnService } from '@121-service/src/fsp-integrations/integrations/mtn/services/mtn.service';
import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';

@UseGuards(AuthenticatedUserGuard)
@ApiTags('fsps/mtn')
@Controller()
export class MtnController {
  public constructor(private readonly mtnService: MtnService) {}

  @AuthenticatedUser({
    isAdmin: true,
  })
  @ApiOperation({
    summary:
      'Create a disbursement transfer via the MTN MoMo API. Uses a hardcoded payload for mock/testing purposes.',
  })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'Transfer created successfully',
  })
  @HttpCode(HttpStatus.ACCEPTED)
  @Post('fsps/mtn/transfer')
  public async createTransfer(): Promise<void> {
    await this.mtnService.createTransfer();
  }
}
