import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

class SafaricomTransferCallbackResult {
  @ApiProperty()
  @IsNotEmpty()
  readonly OriginatorConversationID: string;
  @ApiProperty()
  readonly ConversationID: string;
  @ApiProperty()
  readonly TransactionID: string;
  @ApiProperty()
  readonly ResultCode: number;
  @ApiProperty()
  readonly ResultDesc: string;
}

// Does not need validation decorators on all properties, because we want to accept any payload structure from Safaricom, as we cannot control it.
export class SafaricomTransferCallbackDto {
  @ApiProperty()
  @IsNotEmpty()
  readonly Result: SafaricomTransferCallbackResult;
}
