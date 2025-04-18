import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl } from 'class-validator';

import { formatWhatsAppNumber } from '@mock-service/src/utils/phone-number.helpers';

export enum TwilioStatus {
  delivered = 'delivered',
  read = 'read',
  undelivered = 'undelivered',
  accepted = 'accepted',
  queued = 'queued',
  sent = 'sent',
  failed = 'failed',
}

export class TwilioMessagesCreateDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  public readonly Body: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  public readonly ContentSid: string;

  @ApiProperty()
  @IsString()
  public readonly MessagingServiceSid: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  public readonly From?: string;

  @ApiProperty({
    description: 'The URL to POST to when the message is processed.',
  })
  @IsUrl()
  public readonly StatusCallback: string;

  @ApiProperty()
  @IsString()
  public readonly To: string;

  @ApiProperty()
  @IsUrl()
  @IsOptional()
  public readonly MediaUrl?: string;

  @ApiProperty({ example: 'generic-templated' })
  @IsString()
  @IsOptional()
  public readonly MessageContentType?: string;
}

class AccountSidObject {
  public readonly accountSid: string;
}

export class TwilioValidateRequestDto {
  @ApiProperty()
  @IsString()
  public readonly authToken: string;

  @ApiProperty()
  @IsString()
  public readonly signature: string;

  @ApiProperty()
  @IsString()
  public readonly callbackUrl: string;

  @ApiProperty()
  @IsString()
  public readonly body: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  public readonly accountSidObject?: AccountSidObject;
}

export class TwilioStatusCallbackDto {
  @ApiProperty({ example: 'SMb677b6846ec347cf80b8a5fd948efb53' })
  @IsString()
  public MessageSid: string;

  @ApiProperty({ example: TwilioStatus.delivered })
  @IsString()
  public MessageStatus: TwilioStatus;

  @ApiProperty({ example: 'Twilio Error: []' })
  @IsString()
  @IsOptional()
  public ErrorMessage?: string;

  @ApiProperty({ example: '63015' })
  @IsString()
  @IsOptional()
  public ErrorCode?: string;

  @IsOptional()
  public SmsSid?: string;

  @IsOptional()
  public To?: string;
}

export class TwilioIncomingCallbackDto {
  @ApiProperty({ example: 'SMb677b6846ec347cf80b8a5fd948efb53' })
  @IsString()
  @IsOptional()
  public MessageSid?: string;

  @ApiProperty({ example: formatWhatsAppNumber('31600000000') })
  @IsString()
  public From: string;

  @ApiProperty({ example: '31600000000' })
  @IsString()
  @IsOptional()
  public WaId?: string;

  @ApiProperty({
    example: formatWhatsAppNumber('31600000000'),
  })
  @IsString()
  @IsOptional()
  public To?: string;

  @ApiProperty({ example: 'Yes' })
  @IsString()
  @IsOptional()
  public Body?: string;
}
