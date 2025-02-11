import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class SafaricomTimeoutCallbackDto {
  @ApiProperty()
  readonly InitiatorName: string;
  @ApiProperty()
  readonly SecurityCredential: string;
  @ApiProperty()
  readonly CommandID: string;
  @ApiProperty()
  readonly Amount: number;
  @ApiProperty()
  readonly PartyA: string;
  @ApiProperty()
  readonly PartyB: string;
  @ApiProperty()
  readonly Remarks: string;
  @ApiProperty()
  readonly QueueTimeOutURL: string;
  @ApiProperty()
  readonly ResultURL: string;
  @ApiProperty()
  @IsNotEmpty()
  readonly OriginatorConversationID: string;
  @ApiProperty()
  readonly IDType: string;
  @ApiProperty()
  readonly IDNumber: string;
}
