import { Get, Param, Controller, Post } from '@nestjs/common';
import { ApiUseTags, ApiOperation, ApiImplicitParam } from '@nestjs/swagger';
import { ProofService } from './proof.service';
import { ConnectionEntity } from '../create-connection/connection.entity';

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

  @ApiOperation({ title: 'Post proof' })
  @ApiImplicitParam({
    name: 'programId',
    required: true,
    type: 'number',
  })
  @ApiImplicitParam({ name: 'did', required: true, type: 'string' })
  @Post('proof/:programId/:did')
  public async postProof(@Param() params): Promise<object> {
    return await this.proofService.postProof(
      params.programId,
      params.did,
      'superencryptedproof',
    );
  }
}
