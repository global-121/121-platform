import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { IntersolvePayoutStatus } from '../payments/fsp-integration/intersolve/enum/intersolve-payout-status.enum';

export enum TwilioStatus {
  delivered = 'delivered',
  read = 'read',
  undelivered = 'undelivered',
  failed = 'failed',
}

export class TwilioMessagesCreateDto {
  @ApiProperty()
  @IsString()
  public readonly body: string;

  @ApiProperty()
  @IsString()
  public readonly messagingServiceSid: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  public readonly from: string;

  @ApiProperty()
  @IsString()
  public readonly statusCallback: string;

  @ApiProperty()
  @IsString()
  public readonly to: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  public readonly mediaUrl: string;

  @ApiProperty({ example: IntersolvePayoutStatus.InitialMessage })
  @IsString()
  @IsOptional()
  public readonly messageType: string;
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
  public readonly accountSidObject: AccountSidObject;
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
  public ErrorMessage: string;

  @ApiProperty({ example: '63015' })
  @IsString()
  @IsOptional()
  public ErrorCode: string;

  public SmsSid: string;

  public To: string;
}

export class TwilioIncomingCallbackDto {
  @ApiProperty({ example: 'SMb677b6846ec347cf80b8a5fd948efb53' })
  @IsString()
  @IsOptional()
  public MessageSid: string;

  @ApiProperty({ example: 'whatsapp:+31600000000' })
  @IsString()
  public From: string;

  @ApiProperty({ example: '31600000000' })
  @IsString()
  @IsOptional()
  public WaId: string;

  @ApiProperty({
    example: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
  })
  @IsString()
  @IsOptional()
  public To: string;

  @ApiProperty({ example: 'Yes' })
  @IsString()
  @IsOptional()
  public Body: string;
}
