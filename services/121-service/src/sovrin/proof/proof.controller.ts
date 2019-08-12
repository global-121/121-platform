import { Get, Param, Controller, Post, Body } from '@nestjs/common';
import { ApiUseTags, ApiOperation, ApiImplicitParam } from '@nestjs/swagger';
import { ProofService } from './proof.service';
import { InculdeMeDto } from '../../programs/program/dto/include-me.dto';

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
  @Post('proof')
  public async validateProof(
    @Body() inclusionData: InculdeMeDto,
  ): Promise<object> {
    return await this.proofService.validateProof(
      inclusionData.programId,
      inclusionData.did,
      inclusionData.encryptedProof,
    );
  }
}
