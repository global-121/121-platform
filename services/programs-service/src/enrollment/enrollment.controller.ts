import { Get, Param, Controller } from '@nestjs/common';
import { ApiUseTags, ApiOperation, ApiImplicitParam } from '@nestjs/swagger';
import { EnrollmentService } from './enrollment.service';

@ApiUseTags('enrollment')
@Controller('enrollment')
export class EnrollmentController {
  private readonly enrollmentService: EnrollmentService;
  public constructor(enrollmentService: EnrollmentService) {
    this.enrollmentService = enrollmentService;
  }

  @ApiOperation({ title: 'Get proof request' })
  @ApiImplicitParam({ name: 'programId', required: true, type: 'number' })
  @Get('getProofRequest/:programId')
  public async getProofRequest(
    @Param('programId') programId: number,
  ): Promise<any> {
    return await this.enrollmentService.getProofRequest(programId);
  }

  // @ApiOperation({ title: 'Submit answers' })
  // @ApiImplicitParam({ name: 'programId', required: true, type: 'number' })
  // @Get('submitAnswers/:programId')
  // public async submitAnswers(@Param('programId') programId: number): Promise<CustomCriterium[]> {
  //   return await this.enrollmentService.submitAnswers(programId);
  // }
}
