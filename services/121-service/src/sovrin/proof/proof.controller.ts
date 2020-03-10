import { Get, Param, Controller } from '@nestjs/common';
import { ApiUseTags, ApiOperation, ApiImplicitParam } from '@nestjs/swagger';
import { ProofService } from './proof.service';

@ApiUseTags('sovrin')
@Controller('sovrin')
export class ProofController {
  private readonly proofService: ProofService;
  public constructor(proofService: ProofService) {
    this.proofService = proofService;
  }

  @ApiOperation({ title: 'Get proof request' })
  @ApiImplicitParam({ name: 'programId', required: true, type: 'number' })
  @Get('proof/proofRequest/:programId')
  public async getProofRequest(
    @Param('programId') programId: number,
  ): Promise<any> {
    return await this.proofService.getProofRequest(programId);
  }

}
