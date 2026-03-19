import { ApproverInThresholdResponseDto } from '@121-service/src/programs/program-approval-thresholds/dtos/approver-in-threshold-response.dto';
import { GetProgramApprovalThresholdResponseDto } from '@121-service/src/programs/program-approval-thresholds/dtos/get-program-approval-threshold-response.dto';

import { Dto } from '~/utils/dto-type';

export type ApproverInThreshold = Dto<ApproverInThresholdResponseDto>;
export type ApprovalThreshold = Dto<GetProgramApprovalThresholdResponseDto>;
