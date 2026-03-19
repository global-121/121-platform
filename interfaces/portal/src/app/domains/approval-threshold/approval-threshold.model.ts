import { ApproverInThresholdResponseDto } from '@121-service/src/programs/program-approval-thresholds/dtos/approver-in-threshold-response.dto';
import { CreateProgramApprovalThresholdDto } from '@121-service/src/programs/program-approval-thresholds/dtos/create-program-approval-threshold.dto';
import { GetProgramApprovalThresholdResponseDto } from '@121-service/src/programs/program-approval-thresholds/dtos/get-program-approval-threshold-response.dto';

import { Dto } from '~/utils/dto-type';

export type ApprovalThreshold = Dto<GetProgramApprovalThresholdResponseDto>;

export type Approver = Dto<ApproverInThresholdResponseDto>;

export type CreateApprovalThreshold = Dto<CreateProgramApprovalThresholdDto>;
