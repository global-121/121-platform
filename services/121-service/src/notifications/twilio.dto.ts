import { ApiModelProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { IntersolvePayoutStatus } from '../fsp/api/enum/intersolve-payout-status.enum';

export enum TwilioStatus {
  delivered = 'delivered',
  read = 'read',
  undelivered = 'undelivered',
  failed = 'failed',
}

export class TwilioMessagesCreateDto {
  @ApiModelProperty()
  @IsString()
  public readonly body: string;

  @ApiModelProperty()
  @IsString()
  public readonly messagingServiceSid: string;

  @ApiModelProperty()
  @IsString()
  @IsOptional()
  public readonly from: string;

  @ApiModelProperty()
  @IsString()
  public readonly statusCallback: string;

  @ApiModelProperty()
  @IsString()
  public readonly to: string;

  @ApiModelProperty()
  @IsString()
  @IsOptional()
  public readonly mediaUrl: string;

  @ApiModelProperty({ example: IntersolvePayoutStatus.InitialMessage })
  @IsString()
  @IsOptional()
  public readonly messageType: string;
}

class AccountSidObject {
  public readonly accountSid: string;
}

export class TwilioValidateRequestDto {
  @ApiModelProperty()
  @IsString()
  public readonly authToken: string;

  @ApiModelProperty()
  @IsString()
  public readonly signature: string;

  @ApiModelProperty()
  @IsString()
  public readonly callbackUrl: string;

  @ApiModelProperty()
  @IsString()
  public readonly body: string;

  @ApiModelProperty()
  @IsString()
  @IsOptional()
  public readonly accountSidObject: AccountSidObject;
}

export class TwilioStatusCallbackDto {
  @ApiModelProperty({ example: 'SMb677b6846ec347cf80b8a5fd948efb53' })
  @IsString()
  public MessageSid: string;

  @ApiModelProperty({ example: TwilioStatus.delivered })
  @IsString()
  public MessageStatus: TwilioStatus;

  @ApiModelProperty({ example: 'Twilio Error: []' })
  @IsString()
  @IsOptional()
  public ErrorMessage: string;

  @ApiModelProperty({ example: '63015' })
  @IsString()
  @IsOptional()
  public ErrorCode: string;
}

export class TwilioIncomingCallbackDto {
  @ApiModelProperty({ example: 'SMb677b6846ec347cf80b8a5fd948efb53' })
  @IsString()
  @IsOptional()
  public MessageSid: string;

  @ApiModelProperty({ example: 'whatsapp:+31600000000' })
  @IsString()
  public From: string;

  @ApiModelProperty({ example: '31600000000' })
  @IsString()
  @IsOptional()
  public WaId: string;

  @ApiModelProperty({
    example: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
  })
  @IsString()
  @IsOptional()
  public To: string;

  @ApiModelProperty({ example: 'Yes' })
  @IsString()
  @IsOptional()
  public Body: string;
}
