import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

// Does not need explicit validation decorators on all properties, because we want to accept any payload structure from Safaricom, as we cannot control it.
export class SafaricomTimeoutCallbackDto {
  @ApiProperty()
  @IsOptional()
  readonly InitiatorName?: string;
  @ApiProperty()
  @IsOptional()
  readonly SecurityCredential?: string;
  @ApiProperty()
  @IsOptional()
  readonly CommandID?: string;
  @ApiProperty()
  @IsOptional()
  readonly Amount?: number;
  @ApiProperty()
  @IsOptional()
  readonly PartyA?: string;
  @ApiProperty()
  @IsOptional()
  readonly PartyB?: string;
  @ApiProperty()
  @IsOptional()
  readonly Remarks?: string;
  @ApiProperty()
  @IsOptional()
  readonly QueueTimeOutURL?: string;
  @ApiProperty()
  @IsOptional()
  readonly ResultURL?: string;
  @ApiProperty()
  @IsOptional()
  readonly OriginatorConversationID?: string;
  @ApiProperty()
  @IsOptional()
  readonly IDType?: string;
  @ApiProperty()
  @IsOptional()
  readonly IDNumber?: string;
}
