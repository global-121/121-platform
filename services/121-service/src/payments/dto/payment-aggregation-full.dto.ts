import { ApiProperty } from '@nestjs/swagger';

import { PaymentAggregationSummaryDto } from '@121-service/src/payments/dto/payment-aggregation-summary.dto';
import { UILanguageTranslation } from '@121-service/src/shared/types/ui-language-translation.type';
import { ApprovalStatusResponseDto } from '@121-service/src/user/approver/dto/approval-status-response.dto';

export class PaymentAggregationFullDto extends PaymentAggregationSummaryDto {
  @ApiProperty({
    example: [
      {
        programFspConfigurationName: 'safaricom-mpesa',
        programFspConfigurationLabel: {
          en: 'Safaricom M-Pesa',
          fr: 'Safaricom M-Pesa',
        },
      },
    ],
    isArray: true,
  })
  fsps: {
    programFspConfigurationName: string | null;
    programFspConfigurationLabel: UILanguageTranslation | null;
  }[];

  @ApiProperty({
    isArray: true,
    type: ApprovalStatusResponseDto,
  })
  approvalStatus: ApprovalStatusResponseDto[];
}
