import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

class SafaricomTransferCallbackResult {
  @ApiProperty()
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

export class SafaricomTransferCallbackDto {
  @ApiProperty()
  @IsNotEmpty()
  readonly Result: SafaricomTransferCallbackResult;
}
