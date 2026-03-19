import { Injectable, Signal } from '@angular/core';

import {
  ApprovalThreshold,
  CreateApprovalThreshold,
} from '~/domains/approval-threshold/approval-threshold.model';
import { DomainApiService } from '~/domains/domain-api.service';

const BASE_ENDPOINT = 'programs';

@Injectable({
  providedIn: 'root',
})
export class ApprovalThresholdApiService extends DomainApiService {
  getApprovalThresholds(programId: Signal<number | string | undefined>) {
    return this.generateQueryOptions<ApprovalThreshold[]>({
      path: [BASE_ENDPOINT, programId, 'approval-thresholds'],
      enabled: () => !!programId(),
    });
  }

  updateApprovalThresholds({
    programId,
    thresholds,
  }: {
    programId: Signal<number | string>;
    thresholds: CreateApprovalThreshold[];
  }) {
    return this.httpWrapperService.perform121ServiceRequest<
      ApprovalThreshold[]
    >({
      method: 'PUT',
      endpoint: `${BASE_ENDPOINT}/${programId().toString()}/approval-thresholds`,
      body: thresholds,
    });
  }
}
