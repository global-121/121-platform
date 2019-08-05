import { Get, Param, Controller, Post } from '@nestjs/common';
import { ApiUseTags, ApiOperation, ApiImplicitParam } from '@nestjs/swagger';
import { EnrollmentService } from './enrollment.service';
import { ConnectionEntity } from '../sovrin/create-connection/connection.entity';

@ApiUseTags('enrollment')
@Controller('enrollment')
export class EnrollmentController {
  private readonly enrollmentService: EnrollmentService;
  public constructor(enrollmentService: EnrollmentService) {
    this.enrollmentService = enrollmentService;
  }

  @ApiOperation({ title: 'Get proof request' })
  @ApiImplicitParam({ name: 'programId', required: true, type: 'number' })
  @Get('proofRequest/:programId')
  public async getProofRequest(
    @Param('programId') programId: number,
  ): Promise<any> {
    return await this.enrollmentService.getProofRequest(programId);
  }

  @ApiOperation({ title: 'Post proof' })
  @ApiImplicitParam({ name: 'programId', required: true, type: 'number' })
  @ApiImplicitParam({ name: 'did', required: true, type: 'string' })
  @Post('proof/:programId/:did')
  public async postProof(@Param() params): Promise<ConnectionEntity> {
    return await this.enrollmentService.postProof(params.programId, params.did);
  }

  @ApiOperation({ title: 'Get inclusion status' })
  @ApiImplicitParam({ name: 'programId', required: true, type: 'number' })
  @ApiImplicitParam({ name: 'did', required: true, type: 'string' })
  @Get('inclusionStatus/:programId/:did')
  public async inclusionStatus(@Param() params): Promise<any> {
    return await this.enrollmentService.getInclusionStatus(params.programId, params.did);
  }

}
