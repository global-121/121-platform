import { VisaCardAction } from '@121-service/src/payments/fsp-integration/intersolve-visa/enums/intersolve-visa-card-action.enum';
import { VisaCardMethod } from '@121-service/src/payments/fsp-integration/intersolve-visa/enums/intersolve-visa-card-method.enum';
import { ApiProperty } from '@nestjs/swagger';

export class VisaCardActionLinkDto {
  @ApiProperty({ example: 'https://example.com' })
  href: string;
  @ApiProperty({ enum: VisaCardAction })
  action: VisaCardAction;
  @ApiProperty({ enum: VisaCardMethod })
  method: VisaCardMethod;
}
