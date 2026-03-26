import { Controller, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { MtnApiKeyHelperService } from '@121-service/src/fsp-integrations/integrations/mtn/services/mtn.api.key.helper.service';
import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';

@UseGuards(AuthenticatedUserGuard)
@ApiTags('fsps/mtn')
@Controller()
export class MtnController {
  public constructor(
    private readonly mtnApiKeyHelperService: MtnApiKeyHelperService,
  ) {}

  @AuthenticatedUser({
    isAdmin: true,
  })
  @ApiOperation({
    summary:
      'Create an MTN API user and generate an API key. This calls POST /apiuser followed by POST /apiuser/{referenceId}/apikey on the MTN MoMo API.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'API key created successfully',
  })
  @Post('fsps/mtn/api-key')
  public async createApiKey(): Promise<{ apiKey: string }> {
    const apiKey = await this.mtnApiKeyHelperService.getApiKey();
    return { apiKey };
  }
}
