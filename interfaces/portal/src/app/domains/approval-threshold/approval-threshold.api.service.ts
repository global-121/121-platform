import { Injectable, Signal } from '@angular/core';

import { CreateProgramApprovalThresholdDto } from '@121-service/src/programs/program-approval-thresholds/dtos/create-program-approval-threshold.dto';

import { ApprovalThreshold } from '~/domains/approval-threshold/approval-threshold.model';
import { DomainApiService } from '~/domains/domain-api.service';

const BASE_ENDPOINT = 'programs';

@Injectable({
  providedIn: 'root',
})
export class ApprovalThresholdApiService extends DomainApiService {
  getApprovalThresholds(programId: Signal<number | string>) {
    return this.generateQueryOptions<ApprovalThreshold[]>({
      path: [BASE_ENDPOINT, programId, 'approval-thresholds'],
    });
  }

  createOrReplaceApprovalThresholds(
    programId: Signal<number | string>,
    thresholds: Pick<
      CreateProgramApprovalThresholdDto,
      'thresholdAmount' | 'userIds'
    >[],
  ) {
    return this.httpWrapperService.perform121ServiceRequest<
      ApprovalThreshold[]
    >({
      method: 'PUT',
      endpoint: `${BASE_ENDPOINT}/${programId().toString()}/approval-thresholds`,
      body: thresholds,
    });
  }
}
