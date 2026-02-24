import { ApiProperty } from '@nestjs/swagger';

import { ApprovalStatusResponseDto } from '@121-service/src/payments/dto/approval-status-response.dto';
import { PaymentAggregationSummaryDto } from '@121-service/src/payments/dto/payment-aggregation-summary.dto';
import { UILanguageTranslation } from '@121-service/src/shared/types/ui-language-translation.type';

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
